using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.Auth;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AuthEndpointExtensions
{
    public static RouteGroupBuilder MapCustomAuthEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/logout", async (
                ClaimsPrincipal principal,
                UserManager<ApplicationUser> userManager,
                SignInManager<ApplicationUser> signInManager) =>
            {
                var user = await userManager.GetUserAsync(principal);
                if (user is not null)
                {
                    await userManager.UpdateSecurityStampAsync(user);
                }

                await signInManager.SignOutAsync();
                return Results.Ok();
            })
            .WithName("Logout")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        group.MapGet("/me", async (
                ClaimsPrincipal principal,
                UserManager<ApplicationUser> userManager) =>
            {
                var user = await userManager.GetUserAsync(principal);
                if (user is null)
                {
                    return Results.Unauthorized();
                }

                var roles = await userManager.GetRolesAsync(user);
                return Results.Ok(new CurrentUserResponse(
                    user.Id,
                    user.Email ?? string.Empty,
                    roles.ToArray()));
            })
            .WithName("GetCurrentUser")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        group.MapGet("/admin/ping", (ClaimsPrincipal principal) =>
            {
                return Results.Ok(new AdminPingResponse(
                    $"Authenticated as {principal.Identity?.Name ?? "unknown"}",
                    DateTimeOffset.UtcNow));
            })
            .WithName("AdminPing")
            .RequireAuthorization(AppPolicies.AdminOnly);

        return group;
    }
}
