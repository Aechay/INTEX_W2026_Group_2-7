namespace INTEX_W2026_Group_2_7.Models.Auth;

public sealed record CurrentUserResponse(string UserId, string Email, IReadOnlyCollection<string> Roles);
