using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Configuration;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Endpoints;
using INTEX_W2026_Group_2_7.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
const string ApiContentSecurityPolicy =
    "default-src 'none'; " +
    "base-uri 'none'; " +
    "frame-ancestors 'none'; " +
    "form-action 'none'; " +
    "object-src 'none'";

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<AuthBootstrapOptions>(
    builder.Configuration.GetSection(AuthBootstrapOptions.SectionName));
builder.Services.Configure<FrontendOptions>(
    builder.Configuration.GetSection(FrontendOptions.SectionName));
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

builder.Services.AddSingleton<IEmailSender<ApplicationUser>, LoggingIdentityEmailSender>();

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AppPolicies.AuthenticatedUser, policy => policy.RequireAuthenticatedUser())
    .AddPolicy(AppPolicies.AdminOnly, policy => policy.RequireRole(AppRoles.Admin));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
            return;
        }

        policy.WithOrigins(
                "https://wintex.alijahwhitney.dev",
                "https://wonderful-ocean-0a5af5610.2.azurestaticapps.net")
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
            context.Response.Headers["Content-Security-Policy"] = ApiContentSecurityPolicy;
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

await app.SeedIdentityDataAsync();

app.Run();

public partial class Program;
