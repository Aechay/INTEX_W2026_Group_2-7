using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Data;

public class IdentityAppDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    public IdentityAppDbContext(DbContextOptions<IdentityAppDbContext> options)
        : base(options)
    {
    }
}
