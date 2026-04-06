using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace INTEX_W2026_Group_2_7.Data.DesignTime;

public class IdentityAppDbContextFactory : IDesignTimeDbContextFactory<IdentityAppDbContext>
{
    public IdentityAppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<IdentityAppDbContext>();
        optionsBuilder.UseSqlServer(DesignTimeConnectionStringResolver.Resolve("IdentityConnection"));

        return new IdentityAppDbContext(optionsBuilder.Options);
    }
}
