using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Services;

public class ApplicationUserManager : UserManager<ApplicationUser>
{
    public ApplicationUserManager(
        IUserStore<ApplicationUser> store,
        IOptions<IdentityOptions> optionsAccessor,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IEnumerable<IUserValidator<ApplicationUser>> userValidators,
        IEnumerable<IPasswordValidator<ApplicationUser>> passwordValidators,
        ILookupNormalizer keyNormalizer,
        IdentityErrorDescriber errors,
        IServiceProvider services,
        ILogger<UserManager<ApplicationUser>> logger)
        : base(
            store,
            optionsAccessor,
            passwordHasher,
            userValidators,
            passwordValidators,
            keyNormalizer,
            errors,
            services,
            logger)
    {
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user)
    {
        var result = await base.CreateAsync(user);
        await EnsureDefaultUserRoleAsync(user, result);
        return result;
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
    {
        var result = await base.CreateAsync(user, password);
        await EnsureDefaultUserRoleAsync(user, result);
        return result;
    }

    private async Task EnsureDefaultUserRoleAsync(ApplicationUser user, IdentityResult result)
    {
        if (!result.Succeeded || await IsInRoleAsync(user, AppRoles.User))
        {
            return;
        }

        var roleResult = await AddToRoleAsync(user, AppRoles.User);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to assign '{AppRoles.User}' role: {string.Join(", ", roleResult.Errors.Select(error => error.Description))}");
        }
    }
}
