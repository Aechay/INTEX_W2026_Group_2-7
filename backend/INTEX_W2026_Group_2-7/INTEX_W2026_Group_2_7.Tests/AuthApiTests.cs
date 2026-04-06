using System.Net;
using System.Net.Http.Json;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace INTEX_W2026_Group_2_7.Tests;

public class AuthApiTests
{
    [Fact]
    public async Task Register_WritesUserToIdentityStoreOnly()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync("/auth/register", new
        {
            email = "student1@test.local",
            password = "StudentPassword123!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var user = await factory.WithScopeAsync(async services =>
        {
            var identityDbContext = services.GetRequiredService<IdentityAppDbContext>();
            return await identityDbContext.Users.SingleOrDefaultAsync(u => u.Email == "student1@test.local");
        });

        var operationalEntityCount = await factory.WithScopeAsync(services =>
        {
            var operationalDbContext = services.GetRequiredService<OperationalDbContext>();
            return Task.FromResult(operationalDbContext.Model.GetEntityTypes().Count());
        });

        Assert.NotNull(user);
        Assert.Equal(0, operationalEntityCount);
    }

    [Fact]
    public async Task Login_WithBearerFlow_ReturnsOpaqueTokens()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        await client.PostAsJsonAsync("/auth/register", new
        {
            email = "student2@test.local",
            password = "StudentPassword123!"
        });

        var response = await client.PostAsJsonAsync("/auth/login?useCookies=false", new
        {
            email = "student2@test.local",
            password = "StudentPassword123!"
        });

        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<TestWebApplicationFactory.AccessTokenResponse>();

        Assert.NotNull(payload);
        Assert.Equal("Bearer", payload!.TokenType);
        Assert.False(string.IsNullOrWhiteSpace(payload.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(payload.RefreshToken));
        Assert.True(payload.ExpiresIn > 0);
    }

    [Fact]
    public async Task ProtectedEndpoint_Returns401WithoutToken_And200WithToken()
    {
        await using var factory = new TestWebApplicationFactory();
        using var anonymousClient = factory.CreateHttpsClient();

        await anonymousClient.PostAsJsonAsync("/auth/register", new
        {
            email = "student3@test.local",
            password = "StudentPassword123!"
        });

        var anonymousResponse = await anonymousClient.GetAsync("/weatherforecast");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

        using var authenticatedClient = await factory.CreateAuthenticatedClientAsync("student3@test.local", "Student123!");
        var authorizedResponse = await authenticatedClient.GetAsync("/weatherforecast");

        Assert.Equal(HttpStatusCode.OK, authorizedResponse.StatusCode);
    }

    [Fact]
    public async Task CurrentUserEndpoint_ReturnsIdentitySnapshot()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        await client.PostAsJsonAsync("/auth/register", new
        {
            email = "student4@test.local",
            password = "StudentPassword123!"
        });

        using var authenticatedClient = await factory.CreateAuthenticatedClientAsync("student4@test.local", "Student123!");
        var response = await authenticatedClient.GetAsync("/auth/me");

        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();

        Assert.NotNull(payload);
        Assert.Equal("student4@test.local", payload!.Email);
        Assert.Contains("User", payload.Roles);
    }

    [Fact]
    public async Task NormalUser_IsForbiddenFromAdminPing()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        await client.PostAsJsonAsync("/auth/register", new
        {
            email = "student5@test.local",
            password = "StudentPassword123!"
        });

        using var authenticatedClient = await factory.CreateAuthenticatedClientAsync("student5@test.local", "Student123!");
        var response = await authenticatedClient.GetAsync("/auth/admin/ping");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task BootstrapAdmin_CanReachAdminEndpoint_AndHasAdminRole()
    {
        await using var factory = new TestWebApplicationFactory();
        using var authenticatedClient = await factory.CreateAuthenticatedClientAsync("admin@test.local", "Admin123!");

        var response = await authenticatedClient.GetAsync("/auth/admin/ping");
        response.EnsureSuccessStatusCode();

        var adminRoles = await factory.WithScopeAsync(async services =>
        {
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var adminUser = await userManager.FindByEmailAsync("admin@test.local");
            return await userManager.GetRolesAsync(adminUser!);
        });

        Assert.Contains("Admin", adminRoles);
        Assert.Contains("User", adminRoles);
    }

    private sealed record CurrentUserResponse(string UserId, string Email, IReadOnlyCollection<string> Roles);
}
