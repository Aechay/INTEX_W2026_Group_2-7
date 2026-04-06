using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Data;

public class OperationalDbContext : DbContext
{
    public OperationalDbContext(DbContextOptions<OperationalDbContext> options)
        : base(options)
    {
    }
}
