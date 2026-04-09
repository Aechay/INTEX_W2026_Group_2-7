using System.Net.Http.Headers;
using System.Net.Http.Json;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Services.Ml;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace INTEX_W2026_Group_2_7.Tests.Infrastructure;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly Action<IServiceCollection>? _configureTestServices;
    private readonly string _identityDatabaseName = $"identity-{Guid.NewGuid():N}";
    private readonly string _operationalDatabaseName = $"operational-{Guid.NewGuid():N}";
    private readonly ServiceProvider _inMemoryServiceProvider = new ServiceCollection()
        .AddEntityFrameworkInMemoryDatabase()
        .BuildServiceProvider();

    public TestWebApplicationFactory(Action<IServiceCollection>? configureTestServices = null)
    {
        _configureTestServices = configureTestServices;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=localhost;Database=OperationalTest;User Id=sa;Password=Password123!;TrustServerCertificate=True",
                ["ConnectionStrings:IdentityConnection"] = "Server=localhost;Database=IdentityTest;User Id=sa;Password=Password123!;TrustServerCertificate=True",
                ["AuthBootstrap:AdminEmail"] = "admin@test.local",
                ["AuthBootstrap:AdminPassword"] = "AdminPassword123!",
                ["Frontend:BaseUrl"] = "https://frontend.test.local",
                ["SocialMediaInference:BaseUrl"] = "https://ml-function.test.local",
                ["SocialMediaInference:Route"] = "/api/social-media/predict",
                ["SocialMediaInference:SharedSecret"] = "test-secret",
                ["Authentication:Google:ClientId"] = string.Empty,
                ["Authentication:Google:ClientSecret"] = string.Empty
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<OperationalDbContext>();
            services.RemoveAll<IdentityAppDbContext>();
            services.RemoveAll<DbContextOptions<OperationalDbContext>>();
            services.RemoveAll<DbContextOptions<IdentityAppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<OperationalDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<IdentityAppDbContext>>();

            services.AddDbContext<OperationalDbContext>(options =>
                options.UseInMemoryDatabase(_operationalDatabaseName)
                    .UseInternalServiceProvider(_inMemoryServiceProvider));
            services.AddDbContext<IdentityAppDbContext>(options =>
                options.UseInMemoryDatabase(_identityDatabaseName)
                    .UseInternalServiceProvider(_inMemoryServiceProvider));

            services.RemoveAll<IEmailSender<ApplicationUser>>();
            services.AddSingleton<IEmailSender<ApplicationUser>, NullEmailSender>();

            _configureTestServices?.Invoke(services);
        });
    }

    private sealed class NullEmailSender : IEmailSender<ApplicationUser>
    {
        public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink) => Task.CompletedTask;
        public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink) => Task.CompletedTask;
        public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode) => Task.CompletedTask;
    }

    public HttpClient CreateHttpsClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
    }

    public async Task<HttpClient> CreateAuthenticatedClientAsync(string email, string password)
    {
        var client = CreateHttpsClient();
        var loginResponse = await client.PostAsJsonAsync("/auth/login?useCookies=false", new
        {
            email,
            password
        });

        loginResponse.EnsureSuccessStatusCode();

        var token = await loginResponse.Content.ReadFromJsonAsync<AccessTokenResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token!.AccessToken);

        return client;
    }

    public async Task<T> WithScopeAsync<T>(Func<IServiceProvider, Task<T>> action)
    {
        await using var scope = Services.CreateAsyncScope();
        return await action(scope.ServiceProvider);
    }

    public sealed record AccessTokenResponse(
        string TokenType,
        string AccessToken,
        long ExpiresIn,
        string RefreshToken);

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _inMemoryServiceProvider.Dispose();
        }
    }
}
