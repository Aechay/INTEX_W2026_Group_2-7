using System.ComponentModel.DataAnnotations;

namespace INTEX_W2026_Group_2_7.Data;

public class User
{
    [Key]
    public int UserID { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
}