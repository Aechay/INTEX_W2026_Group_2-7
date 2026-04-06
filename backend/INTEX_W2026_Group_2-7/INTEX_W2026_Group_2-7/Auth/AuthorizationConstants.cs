namespace INTEX_W2026_Group_2_7.Auth;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string User = "User";
}

public static class AppPolicies
{
    public const string AuthenticatedUser = nameof(AuthenticatedUser);
    public const string AdminOnly = nameof(AdminOnly);
}
