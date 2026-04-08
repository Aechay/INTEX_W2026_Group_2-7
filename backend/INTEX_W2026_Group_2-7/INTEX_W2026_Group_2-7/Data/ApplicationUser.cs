using Microsoft.AspNetCore.Identity;

namespace INTEX_W2026_Group_2_7.Data;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
}
