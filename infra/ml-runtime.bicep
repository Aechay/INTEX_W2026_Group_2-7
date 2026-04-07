targetScope = 'resourceGroup'

@description('Short prefix used to name the ML runtime resources.')
param namePrefix string = 'hope-ml'

@description('Deployment location.')
param location string = resourceGroup().location

@description('Tags applied to every resource.')
param tags object = {}

@description('Azure SQL Server fully qualified domain name used by the training job, for example myserver.database.windows.net.')
param sqlServerFqdn string

@description('Azure SQL database name used by the training job.')
param sqlDatabaseName string

@description('Cron schedule for the Container Apps job. Azure Container Apps evaluates this in UTC. 08:00 UTC aligns to 2:00 AM America/Denver during daylight time.')
param trainingScheduleCron string = '0 8 * * *'

@description('Training container image repository name inside Azure Container Registry.')
param trainingImageName string = 'ml-runtime'

@description('Training container image tag.')
param trainingImageTag string = 'latest'

@description('Optional existing backend managed identity principal id that should be granted Key Vault read access for the shared function secret.')
param backendPrincipalId string = ''

@secure()
@description('Shared secret used by the backend when calling the social-media Function App.')
param mlFunctionSharedSecret string

var normalizedPrefix = toLower(replace(namePrefix, '-', ''))
var suffix = toLower(uniqueString(resourceGroup().id, namePrefix))
var storageAccountName = take('${normalizedPrefix}${suffix}sa', 24)
var functionHostStorageName = take('${normalizedPrefix}${suffix}fs', 24)
var containerRegistryName = take('${normalizedPrefix}${suffix}cr', 50)
var containerRegistryLoginServer = '${containerRegistryName}.azurecr.io'
var keyVaultName = take('${normalizedPrefix}-${suffix}-kv', 24)
var logAnalyticsName = '${namePrefix}-ml-logs'
var appInsightsName = '${namePrefix}-ml-ai'
var containerAppsEnvironmentName = '${namePrefix}-ml-env'
var trainingJobName = '${namePrefix}-training'
var trainingIdentityName = '${namePrefix}-training-id'
var functionPlanName = '${namePrefix}-func-plan'
var functionAppName = '${namePrefix}-social-func'

var acrPullRoleDefinitionId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '7f951dda-4ed3-4680-a7ca-43fe172d538d'
)
var storageBlobDataContributorRoleDefinitionId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
)
var keyVaultSecretsUserRoleDefinitionId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    retentionInDays: 30
    features: {
      searchVersion: 1
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource functionHostStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: functionHostStorageName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    dataEndpointEnabled: false
    encryption: {
      status: 'disabled'
    }
    publicNetworkAccess: 'Enabled'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    enablePurgeProtection: true
    enableRbacAuthorization: true
    enableSoftDelete: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    publicNetworkAccess: 'Enabled'
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: 90
    tenantId: subscription().tenantId
  }
}

resource mlFunctionSharedSecretValue 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ml-function-shared-secret'
  properties: {
    value: mlFunctionSharedSecret
  }
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppsEnvironmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

resource functionPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: functionPlanName
  location: location
  tags: tags
  kind: 'functionapp'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

resource socialMediaFunction 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: functionPlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    keyVaultReferenceIdentity: 'SystemAssigned'
    siteConfig: {
      alwaysOn: false
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionHostStorage.name};AccountKey=${functionHostStorage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'ML_STORAGE_ACCOUNT_URL'
          value: 'https://${storageAccount.name}.blob.${environment().suffixes.storage}'
        }
        {
          name: 'ML_STORAGE_CONTAINER_NAME'
          value: 'ml-model-artifacts'
        }
        {
          name: 'ML_SOCIAL_MEDIA_LATEST_BLOB'
          value: 'models/social-media/latest.json'
        }
        {
          name: 'ML_FUNCTION_SHARED_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${mlFunctionSharedSecretValue.properties.secretUriWithVersion})'
        }
      ]
      ftpsState: 'Disabled'
      linuxFxVersion: 'Python|3.12'
      minTlsVersion: '1.2'
    }
  }
}

resource trainingIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: trainingIdentityName
  location: location
  tags: tags
}

resource trainingBlobRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, trainingIdentity.id, 'storage-blob-data-contributor')
  scope: storageAccount
  properties: {
    principalId: trainingIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageBlobDataContributorRoleDefinitionId
  }
}

resource trainingAcrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, trainingIdentity.id, 'acr-pull')
  scope: containerRegistry
  properties: {
    principalId: trainingIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleDefinitionId
  }
}

resource trainingJob 'Microsoft.App/jobs@2024-03-01' = {
  name: trainingJobName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${trainingIdentity.id}': {}
    }
  }
  dependsOn: [
    trainingBlobRoleAssignment
    trainingAcrPullRoleAssignment
  ]
  properties: {
    environmentId: containerAppsEnvironment.id
    configuration: {
      triggerType: 'Schedule'
      replicaTimeout: 7200
      replicaRetryLimit: 0
      scheduleTriggerConfig: {
        cronExpression: trainingScheduleCron
        parallelism: 1
        replicaCompletionCount: 1
      }
      registries: [
        {
          server: containerRegistryLoginServer
          identity: trainingIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'trainer'
          image: '${containerRegistryLoginServer}/${trainingImageName}:${trainingImageTag}'
          env: [
            {
              name: 'ML_INPUT_MODE'
              value: 'sql'
            }
            {
              name: 'ML_SQL_SERVER'
              value: sqlServerFqdn
            }
            {
              name: 'ML_SQL_DATABASE'
              value: sqlDatabaseName
            }
            {
              name: 'ML_STORAGE_ACCOUNT_URL'
              value: 'https://${storageAccount.name}.blob.${environment().suffixes.storage}'
            }
            {
              name: 'ML_STORAGE_CONTAINER_NAME'
              value: 'ml-model-artifacts'
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: trainingIdentity.properties.clientId
            }
          ]
          resources: {
            cpu: any('1.0')
            memory: '2Gi'
          }
        }
      ]
    }
  }
}

resource functionBlobRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, socialMediaFunction.name, 'storage-blob-data-contributor')
  scope: storageAccount
  properties: {
    principalId: socialMediaFunction.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageBlobDataContributorRoleDefinitionId
  }
}

resource functionKeyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, socialMediaFunction.name, 'key-vault-secrets-user')
  scope: keyVault
  properties: {
    principalId: socialMediaFunction.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionId
  }
}

resource backendKeyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(backendPrincipalId)) {
  name: guid(keyVault.id, backendPrincipalId, 'backend-key-vault-secrets-user')
  scope: keyVault
  properties: {
    principalId: backendPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionId
  }
}

output functionAppName string = socialMediaFunction.name
output functionAppUrl string = 'https://${socialMediaFunction.properties.defaultHostName}'
output functionSharedSecretSecretUri string = mlFunctionSharedSecretValue.properties.secretUriWithVersion
output trainingJobName string = trainingJob.name
output containerRegistryLoginServer string = containerRegistryLoginServer
output storageAccountUrl string = 'https://${storageAccount.name}.blob.${environment().suffixes.storage}'
output keyVaultName string = keyVault.name
