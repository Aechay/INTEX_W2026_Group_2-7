using System.Security.Claims;
using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Configuration;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.Auth;
using INTEX_W2026_Group_2_7.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AuthEndpointExtensions
{
    private const string ListExternalAuthProvidersEndpointName = "ListExternalAuthProviders";
    private const string StartExternalAuthEndpointName = "StartExternalAuth";
    private const string ExternalAuthCallbackEndpointName = "ExternalAuthCallback";
    private const string DefaultExternalAuthError = "external_auth_failed";

    public static RouteGroupBuilder MapCustomAuthEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/external/providers", async (
                HttpContext httpContext,
                SignInManager<ApplicationUser> signInManager,
                LinkGenerator linkGenerator) =>
            {
                var providers = (await signInManager.GetExternalAuthenticationSchemesAsync())
                    .Select(scheme => new ExternalAuthProviderResponse(
                        scheme.Name,
                        scheme.DisplayName ?? scheme.Name,
                        linkGenerator.GetUriByName(
                            httpContext,
                            StartExternalAuthEndpointName,
                            new { provider = scheme.Name })
                        ?? $"/auth/external/{Uri.EscapeDataString(scheme.Name)}/start"))
                    .ToArray();

                return Results.Ok(providers);
            })
            .WithName(ListExternalAuthProvidersEndpointName)
            .AllowAnonymous();

        group.MapGet("/external/{provider}/start", async (
                string provider,
                HttpContext httpContext,
                SignInManager<ApplicationUser> signInManager,
                LinkGenerator linkGenerator) =>
            {
                var resolvedProvider = await FindExternalSchemeAsync(signInManager, provider);
                if (resolvedProvider is null)
                {
                    return Results.NotFound();
                }

                var redirectUrl = linkGenerator.GetUriByName(
                    httpContext,
                    ExternalAuthCallbackEndpointName,
                    new { provider = resolvedProvider.Name });

                if (string.IsNullOrWhiteSpace(redirectUrl))
                {
                    return Results.Problem(
                        "The backend could not generate the external authentication callback URL.",
                        statusCode: StatusCodes.Status500InternalServerError);
                }

                var properties = signInManager.ConfigureExternalAuthenticationProperties(
                    resolvedProvider.Name,
                    redirectUrl);

                return Results.Challenge(properties, [resolvedProvider.Name]);
            })
            .WithName(StartExternalAuthEndpointName)
            .AllowAnonymous();

        group.MapGet("/external/{provider}/callback", async (
                string provider,
                string? remoteError,
                HttpContext httpContext,
                SignInManager<ApplicationUser> signInManager,
                UserManager<ApplicationUser> userManager,
                IExternalAuthCodeStore codeStore,
                IOptions<FrontendOptions> frontendOptions) =>
            {
                var resolvedProvider = await FindExternalSchemeAsync(signInManager, provider);
                if (resolvedProvider is null)
                {
                    return Results.NotFound();
                }

                if (!TryBuildFrontendCallbackUrl(frontendOptions.Value, out var frontendCallbackUrl))
                {
                    return Results.Problem(
                        "Frontend:BaseUrl must be configured as an absolute URL before external authentication can complete.",
                        statusCode: StatusCodes.Status500InternalServerError);
                }

                if (!string.IsNullOrWhiteSpace(remoteError))
                {
                    await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                    return Results.Redirect(BuildFrontendAuthRedirectUrl(
                        frontendCallbackUrl,
                        resolvedProvider.Name,
                        error: "remote_error"));
                }

                var externalLoginInfo = await signInManager.GetExternalLoginInfoAsync();
                if (externalLoginInfo is null ||
                    !string.Equals(externalLoginInfo.LoginProvider, resolvedProvider.Name, StringComparison.OrdinalIgnoreCase))
                {
                    await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                    return Results.Redirect(BuildFrontendAuthRedirectUrl(
                        frontendCallbackUrl,
                        resolvedProvider.Name,
                        error: "external_login_info_unavailable"));
                }

                var resolution = await ResolveExternalUserAsync(userManager, signInManager, externalLoginInfo);
                await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);

                if (!resolution.Succeeded)
                {
                    return Results.Redirect(BuildFrontendAuthRedirectUrl(
                        frontendCallbackUrl,
                        resolvedProvider.Name,
                        error: resolution.ErrorCode ?? DefaultExternalAuthError));
                }

                var code = codeStore.Issue(resolution.User!.Id, resolvedProvider.Name);
                return Results.Redirect(BuildFrontendAuthRedirectUrl(
                    frontendCallbackUrl,
                    resolvedProvider.Name,
                    code: code));
            })
            .WithName(ExternalAuthCallbackEndpointName)
            .AllowAnonymous();

        group.MapPost("/external/exchange", async (
                ExternalAuthExchangeRequest request,
                UserManager<ApplicationUser> userManager,
                SignInManager<ApplicationUser> signInManager,
                IExternalAuthCodeStore codeStore) =>
            {
                if (string.IsNullOrWhiteSpace(request.Code) ||
                    !codeStore.TryConsume(request.Code, out var authCode))
                {
                    return Results.Unauthorized();
                }

                var user = await userManager.FindByIdAsync(authCode.UserId);
                if (user is null ||
                    await userManager.IsLockedOutAsync(user) ||
                    !await signInManager.CanSignInAsync(user))
                {
                    return Results.Unauthorized();
                }

                var principal = await signInManager.CreateUserPrincipalAsync(user);
                return TypedResults.SignIn(principal, authenticationScheme: IdentityConstants.BearerScheme);
            })
            .WithName("ExchangeExternalAuthCode")
            .AllowAnonymous();

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
                    user.DisplayName,
                    roles.ToArray()));
            })
            .WithName("GetCurrentUser")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        group.MapPut("/profile/display-name", async (
                UpdateDisplayNameRequest request,
                ClaimsPrincipal principal,
                UserManager<ApplicationUser> userManager) =>
            {
                var user = await userManager.GetUserAsync(principal);
                if (user is null)
                {
                    return Results.Unauthorized();
                }

                var displayName = request.DisplayName.Trim();
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        [nameof(request.DisplayName)] = ["Display name is required."]
                    });
                }

                if (displayName.Length > 200)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        [nameof(request.DisplayName)] = ["Display name must be 200 characters or fewer."]
                    });
                }

                if (string.Equals(user.DisplayName, displayName, StringComparison.Ordinal))
                {
                    var existingRoles = await userManager.GetRolesAsync(user);
                    return Results.Ok(new CurrentUserResponse(
                        user.Id,
                        user.Email ?? string.Empty,
                        user.DisplayName,
                        existingRoles.ToArray()));
                }

                user.DisplayName = displayName;
                var updateResult = await userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    return Results.ValidationProblem(updateResult.Errors
                        .GroupBy(error => error.Code, StringComparer.Ordinal)
                        .ToDictionary(
                            group => group.Key,
                            group => group.Select(error => error.Description).ToArray(),
                            StringComparer.Ordinal));
                }

                var roles = await userManager.GetRolesAsync(user);
                return Results.Ok(new CurrentUserResponse(
                    user.Id,
                    user.Email ?? string.Empty,
                    user.DisplayName,
                    roles.ToArray()));
            })
            .WithName("UpdateDisplayName")
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

    private static async Task<AuthenticationScheme?> FindExternalSchemeAsync(
        SignInManager<ApplicationUser> signInManager,
        string provider)
    {
        var schemes = await signInManager.GetExternalAuthenticationSchemesAsync();
        return schemes.FirstOrDefault(scheme =>
            string.Equals(scheme.Name, provider, StringComparison.OrdinalIgnoreCase));
    }

    private static async Task<ExternalUserResolutionResult> ResolveExternalUserAsync(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ExternalLoginInfo externalLoginInfo)
    {
        var existingUser = await userManager.FindByLoginAsync(
            externalLoginInfo.LoginProvider,
            externalLoginInfo.ProviderKey);

        if (existingUser is not null)
        {
            if (await userManager.IsLockedOutAsync(existingUser))
            {
                return ExternalUserResolutionResult.Fail("locked_out");
            }

            if (!await signInManager.CanSignInAsync(existingUser))
            {
                return ExternalUserResolutionResult.Fail("not_allowed");
            }

            return ExternalUserResolutionResult.Success(existingUser);
        }

        var email = externalLoginInfo.Principal.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            return ExternalUserResolutionResult.Fail("email_required");
        }

        var user = await userManager.FindByEmailAsync(email);
        var displayName = ExternalDisplayNameResolver.Resolve(externalLoginInfo.Principal);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName,
                EmailConfirmed = ShouldMarkEmailConfirmed(externalLoginInfo)
            };

            var createUserResult = await userManager.CreateAsync(user);
            if (!createUserResult.Succeeded)
            {
                return ExternalUserResolutionResult.Fail("user_create_failed");
            }
        }
        else
        {
            var shouldUpdateUser = false;

            if (!user.EmailConfirmed && ShouldMarkEmailConfirmed(externalLoginInfo))
            {
                user.EmailConfirmed = true;
                shouldUpdateUser = true;
            }

            if (!string.IsNullOrWhiteSpace(displayName) &&
                !string.Equals(user.DisplayName, displayName, StringComparison.Ordinal))
            {
                user.DisplayName = displayName;
                shouldUpdateUser = true;
            }

            if (shouldUpdateUser)
            {
                var updateUserResult = await userManager.UpdateAsync(user);
                if (!updateUserResult.Succeeded)
                {
                    return ExternalUserResolutionResult.Fail("user_update_failed");
                }
            }
        }

        var addLoginResult = await userManager.AddLoginAsync(user, externalLoginInfo);
        if (!addLoginResult.Succeeded &&
            await userManager.FindByLoginAsync(externalLoginInfo.LoginProvider, externalLoginInfo.ProviderKey) is null)
        {
            return ExternalUserResolutionResult.Fail("login_link_failed");
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            return ExternalUserResolutionResult.Fail("locked_out");
        }

        if (!await signInManager.CanSignInAsync(user))
        {
            return ExternalUserResolutionResult.Fail("not_allowed");
        }

        return ExternalUserResolutionResult.Success(user);
    }

    private static bool TryBuildFrontendCallbackUrl(FrontendOptions options, out string frontendCallbackUrl)
    {
        frontendCallbackUrl = string.Empty;
        if (!Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var frontendBaseUri))
        {
            return false;
        }

        var callbackPath = string.IsNullOrWhiteSpace(options.ExternalAuthCallbackPath)
            ? "/external-auth/callback"
            : options.ExternalAuthCallbackPath;

        frontendCallbackUrl = new Uri(frontendBaseUri, callbackPath).ToString();
        return true;
    }

    private static string BuildFrontendAuthRedirectUrl(
        string frontendCallbackUrl,
        string provider,
        string? code = null,
        string? error = null)
    {
        var query = new Dictionary<string, string?>
        {
            ["provider"] = provider
        };

        if (!string.IsNullOrWhiteSpace(code))
        {
            query["code"] = code;
        }

        if (!string.IsNullOrWhiteSpace(error))
        {
            query["error"] = error;
        }

        return QueryHelpers.AddQueryString(frontendCallbackUrl, query!);
    }

    private static bool ShouldMarkEmailConfirmed(ExternalLoginInfo externalLoginInfo)
    {
        var emailVerified = externalLoginInfo.Principal.FindFirstValue("email_verified");
        if (bool.TryParse(emailVerified, out var parsedVerifiedFlag))
        {
            return parsedVerifiedFlag;
        }

        return string.Equals(
            externalLoginInfo.LoginProvider,
            GoogleDefaults.AuthenticationScheme,
            StringComparison.OrdinalIgnoreCase);
    }

    private sealed record ExternalUserResolutionResult(ApplicationUser? User, string? ErrorCode)
    {
        public bool Succeeded => User is not null && string.IsNullOrWhiteSpace(ErrorCode);

        public static ExternalUserResolutionResult Success(ApplicationUser user) => new(user, null);

        public static ExternalUserResolutionResult Fail(string errorCode) => new(null, errorCode);
    }
}
