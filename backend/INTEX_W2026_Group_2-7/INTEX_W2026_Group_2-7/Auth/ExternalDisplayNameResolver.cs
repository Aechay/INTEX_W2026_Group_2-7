using System.Security.Claims;

namespace INTEX_W2026_Group_2_7.Auth;

public static class ExternalDisplayNameResolver
{
    public static string? Resolve(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);

        foreach (var claimType in new[]
                 {
                     "given_name",
                     ClaimTypes.GivenName,
                     "name",
                     ClaimTypes.Name,
                     "preferred_username",
                     "nickname"
                 })
        {
            var value = principal.FindFirstValue(claimType)?.Trim();
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}
