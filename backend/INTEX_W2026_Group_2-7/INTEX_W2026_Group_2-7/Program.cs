using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Configuration;
using INTEX_W2026_Group_2_7.Configuration.Ml;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Endpoints;
using INTEX_W2026_Group_2_7.Services;
using INTEX_W2026_Group_2_7.Services.Ml;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


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
                 "https://127.0.0.1:4173"
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
    "object-src 'none'";

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

builder.Services.Configure<AuthBootstrapOptions>(
    builder.Configuration.GetSection(AuthBootstrapOptions.SectionName));
builder.Services.Configure<FrontendOptions>(
    builder.Configuration.GetSection(FrontendOptions.SectionName));
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
    .AddEntityFrameworkStores<IdentityAppDbContext>();

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
builder.Services.AddHttpClient(SocialMediaInferenceClient.HttpClientName);
builder.Services.AddScoped<ISocialMediaInferenceClient, SocialMediaInferenceClient>();

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
app.MapMlEndpoints();

await app.SeedIdentityDataAsync();

app.Run();

public partial class Program;
