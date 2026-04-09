using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Configuration;
using INTEX_W2026_Group_2_7.Configuration.Meta;
using INTEX_W2026_Group_2_7.Configuration.Ml;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Endpoints;
using INTEX_W2026_Group_2_7.Services;
using INTEX_W2026_Group_2_7.Services.Ml;
using INTEX_W2026_Group_2_7.Services.SocialMedia;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
var allowedFrontendOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

if (Uri.TryCreate(builder.Configuration["Frontend:BaseUrl"], UriKind.Absolute, out var configuredFrontendUri))
{
    allowedFrontendOrigins.Add(configuredFrontendUri.GetLeftPart(UriPartial.Authority));
}

allowedFrontendOrigins.Add("https://wonderful-ocean-0a5af5610.2.azurestaticapps.net");
allowedFrontendOrigins.Add("https://hopeshelter.alijahwhitney.dev");
allowedFrontendOrigins.Add("https://wintex.alijahwhitney.dev");

if (builder.Environment.IsDevelopment())
{
    foreach (var origin in new[]
             {
                 "http://localhost:5173",
                 "https://localhost:5173",
                 "http://127.0.0.1:5173",
                 "https://127.0.0.1:5173",
                 "http://localhost:4173",
                 "https://localhost:4173",
                 "http://127.0.0.1:4173",
                 "https://127.0.0.1:4173",
                 "http://localhost:8080",
                 "https://localhost:8080",
                 "http://127.0.0.1:8080",
                 "https://127.0.0.1:8080"
             })
    {
        allowedFrontendOrigins.Add(origin);
    }
}

const string apiContentSecurityPolicy =
    "default-src 'none'; " +
    "base-uri 'none'; " +
    "frame-ancestors 'none'; " +
    "form-action 'none'; " +
    "img-src 'self' data: blob:; " +
    "object-src 'none'";

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.Configure<AuthBootstrapOptions>(
    builder.Configuration.GetSection(AuthBootstrapOptions.SectionName));
builder.Services.Configure<FrontendOptions>(
    builder.Configuration.GetSection(FrontendOptions.SectionName));
builder.Services.Configure<MetaPublishingOptions>(
    builder.Configuration.GetSection(MetaPublishingOptions.SectionName));
builder.Services.Configure<SocialMediaInferenceOptions>(
    builder.Configuration.GetSection(SocialMediaInferenceOptions.SectionName));
builder.Services.Configure<SmtpEmailOptions>(
    builder.Configuration.GetSection(SmtpEmailOptions.SectionName));
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 14;
    options.Password.RequiredUniqueChars = 1;
    options.Tokens.PasswordResetTokenProvider = CustomTokenProviderNames.EightDigitPasswordReset;
});

builder.Services.AddDbContext<OperationalDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetRequiredConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure()));
builder.Services.AddDbContext<IdentityAppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetRequiredConnectionString("IdentityConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure()));

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedAccount = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddRoles<IdentityRole>()
    .AddUserManager<ApplicationUserManager>()
    .AddEntityFrameworkStores<IdentityAppDbContext>()
    .AddTokenProvider<EightDigitPasswordResetTokenProvider<ApplicationUser>>(
        CustomTokenProviderNames.EightDigitPasswordReset);

if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services.AddAuthentication().AddGoogle(googleOptions =>
    {
        googleOptions.ClientId = googleClientId;
        googleOptions.ClientSecret = googleClientSecret;
        googleOptions.SignInScheme = IdentityConstants.ExternalScheme;
        googleOptions.CallbackPath = "/signin-google";
    });
}

builder.Services.AddSingleton<IEmailSender<ApplicationUser>, SmtpIdentityEmailSender>();
builder.Services.AddSingleton<IExternalAuthCodeStore, ExternalAuthCodeStore>();
builder.Services.AddSingleton<ISocialMediaAssetStorage, FileSystemSocialMediaAssetStorage>();
builder.Services.AddHttpClient(SocialMediaInferenceClient.HttpClientName);
builder.Services.AddHttpClient(MetaPublishingService.HttpClientName);
builder.Services.AddScoped<ISocialMediaInferenceClient, SocialMediaInferenceClient>();
builder.Services.AddScoped<IMetaPublishingService, MetaPublishingService>();

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AppPolicies.AuthenticatedUser, policy => policy.RequireAuthenticatedUser())
    .AddPolicy(AppPolicies.AdminOnly, policy => policy.RequireRole(AppRoles.Admin));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedFrontendOrigins.Count == 0)
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
            return;
        }

        policy.WithOrigins(allowedFrontendOrigins.ToArray())
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
    await app.InitializeDatabasesAsync();
}

app.UseCors("Frontend");

app.UseHttpsRedirection();

// Ensure the temporary storage directory exists so the StaticFileProvider can watch it
var storagePath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "social-media-assets", "temp");
Directory.CreateDirectory(storagePath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "wwwroot")),
    OnPrepareResponse = ctx =>
    {
        if (ctx.Context.Request.Path.StartsWithSegments("/social-media-assets/temp"))
        {
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type");
            // Prevent caching of temporary assets to ensure the latest uploads are seen
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        }
    }
});

app.Use(async (context, next) =>
{
    var isDocumentationRequest = app.Environment.IsDevelopment()
        && (context.Request.Path.StartsWithSegments("/swagger")
            || context.Request.Path.StartsWithSegments("/openapi"));

    if (!isDocumentationRequest)
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["Content-Security-Policy"] = apiContentSecurityPolicy;
            return Task.CompletedTask;
        });
    }

    await next();
});

app.UseAuthentication();
app.UseAuthorization();

var authGroup = app.MapGroup("/auth");
authGroup.MapIdentityApi<ApplicationUser>();
authGroup.MapCustomAuthEndpoints();

app.MapControllers();
app.MapAdminDashboardEndpoints();
app.MapAdminCaseloadEndpoints();
app.MapAdminDonationsEndpoints();
app.MapAdminDonorDetailEndpoints();
app.MapAdminSocialMediaEndpoints();
app.MapDonorEndpoints();
app.MapPublicDonationEndpoints();
app.MapMlEndpoints();
app.MapAdminProcessRecordingEndpoints();
app.MapAdminHomeVisitationEndpoints();
app.MapAdminReportsEndpoints();

await app.SeedIdentityDataAsync();

app.Run();

public partial class Program;
