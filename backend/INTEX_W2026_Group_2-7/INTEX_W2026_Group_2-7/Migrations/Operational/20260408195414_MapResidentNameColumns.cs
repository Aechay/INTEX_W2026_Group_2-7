using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INTEX_W2026_Group_2_7.Migrations.Operational
{
    /// <inheritdoc />
    public partial class MapResidentNameColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Residents', 'LastName') IS NOT NULL
                   AND COL_LENGTH('Residents', 'ResidentLastName') IS NULL
                BEGIN
                    EXEC sp_rename N'[Residents].[LastName]', N'ResidentLastName', 'COLUMN';
                END
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Residents', 'FirstName') IS NOT NULL
                   AND COL_LENGTH('Residents', 'ResidentFirstName') IS NULL
                BEGIN
                    EXEC sp_rename N'[Residents].[FirstName]', N'ResidentFirstName', 'COLUMN';
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Residents', 'ResidentLastName') IS NOT NULL
                   AND COL_LENGTH('Residents', 'LastName') IS NULL
                BEGIN
                    EXEC sp_rename N'[Residents].[ResidentLastName]', N'LastName', 'COLUMN';
                END
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Residents', 'ResidentFirstName') IS NOT NULL
                   AND COL_LENGTH('Residents', 'FirstName') IS NULL
                BEGIN
                    EXEC sp_rename N'[Residents].[ResidentFirstName]', N'FirstName', 'COLUMN';
                END
                """);
        }
    }
}
