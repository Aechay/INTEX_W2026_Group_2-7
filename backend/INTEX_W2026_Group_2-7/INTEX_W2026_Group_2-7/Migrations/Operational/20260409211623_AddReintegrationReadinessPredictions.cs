using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INTEX_W2026_Group_2_7.Migrations.Operational
{
    /// <inheritdoc />
    public partial class AddReintegrationReadinessPredictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReintegrationReadinessPredictions",
                columns: table => new
                {
                    RunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    ReadinessScore = table.Column<double>(type: "float", nullable: false),
                    ReadinessCategory = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    PredictedReady = table.Column<bool>(type: "bit", nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ScoredAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReintegrationReadinessPredictions", x => new { x.RunId, x.ResidentId });
                    table.ForeignKey(
                        name: "FK_ReintegrationReadinessPredictions_MlModelRuns_RunId",
                        column: x => x.RunId,
                        principalTable: "MlModelRuns",
                        principalColumn: "RunId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReintegrationReadinessPredictions_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReintegrationReadinessPredictions_ResidentId",
                table: "ReintegrationReadinessPredictions",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_ReintegrationReadinessPredictions_ScoredAt",
                table: "ReintegrationReadinessPredictions",
                column: "ScoredAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReintegrationReadinessPredictions");
        }
    }
}
