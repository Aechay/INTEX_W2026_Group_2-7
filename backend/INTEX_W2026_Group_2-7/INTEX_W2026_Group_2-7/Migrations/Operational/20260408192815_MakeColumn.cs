using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INTEX_W2026_Group_2_7.Migrations.Operational
{
    /// <inheritdoc />
    public partial class MakeColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResidentFirstName",
                table: "Residents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ResidentLastName",
                table: "Residents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResidentFirstName",
                table: "Residents");

            migrationBuilder.DropColumn(
                name: "ResidentLastName",
                table: "Residents");
        }
    }
}
