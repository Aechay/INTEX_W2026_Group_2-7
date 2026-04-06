using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace INTEX_W2026_Group_2_7.Data.DesignTime;

public class OperationalDbContextFactory : IDesignTimeDbContextFactory<OperationalDbContext>
{
    public OperationalDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<OperationalDbContext>();
        optionsBuilder.UseSqlServer(
            DesignTimeConnectionStringResolver.Resolve("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure());

        return new OperationalDbContext(optionsBuilder.Options);
    }
}
