using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INTEX_W2026_Group_2_7.Migrations.Operational
{
    /// <inheritdoc />
    public partial class AddResidentNameFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Residents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "Residents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Residents");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "Residents");
        }
    }
}
