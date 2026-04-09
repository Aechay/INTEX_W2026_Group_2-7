using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INTEX_W2026_Group_2_7.Migrations.Operational
{
    /// <inheritdoc />
    public partial class AddSocialMediaPublishingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SocialMediaPosts_PlatformPostId",
                table: "SocialMediaPosts");

            migrationBuilder.AlterColumn<string>(
                name: "PostUrl",
                table: "SocialMediaPosts",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(512)",
                oldMaxLength: 512);

            migrationBuilder.AlterColumn<string>(
                name: "PlatformPostId",
                table: "SocialMediaPosts",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AddColumn<string>(
                name: "AltText",
                table: "SocialMediaPosts",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CallToActionUrl",
                table: "SocialMediaPosts",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastMetricsUpdatedAtUtc",
                table: "SocialMediaPosts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaAssetUrlsJson",
                table: "SocialMediaPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformMetadataJson",
                table: "SocialMediaPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PredictedDonationValuePhp",
                table: "SocialMediaPosts",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PredictionModelVersion",
                table: "SocialMediaPosts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PredictionScoredAtUtc",
                table: "SocialMediaPosts",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PublishStatus",
                table: "SocialMediaPosts",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Published");

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAtUtc",
                table: "SocialMediaPosts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE dbo.SocialMediaPosts
                SET PublishStatus = 'Published',
                    PublishedAtUtc = CreatedAt
                WHERE PublishStatus = 'Published'
                  AND PublishedAtUtc IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_SocialMediaPosts_PlatformPostId",
                table: "SocialMediaPosts",
                column: "PlatformPostId",
                unique: true,
                filter: "[PlatformPostId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SocialMediaPosts_PlatformPostId",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "AltText",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "CallToActionUrl",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "LastMetricsUpdatedAtUtc",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "MediaAssetUrlsJson",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "PlatformMetadataJson",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "PredictedDonationValuePhp",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "PredictionModelVersion",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "PredictionScoredAtUtc",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "PublishStatus",
                table: "SocialMediaPosts");

            migrationBuilder.DropColumn(
                name: "PublishedAtUtc",
                table: "SocialMediaPosts");

            migrationBuilder.AlterColumn<string>(
                name: "PostUrl",
                table: "SocialMediaPosts",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(512)",
                oldMaxLength: 512,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlatformPostId",
                table: "SocialMediaPosts",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialMediaPosts_PlatformPostId",
                table: "SocialMediaPosts",
                column: "PlatformPostId",
                unique: true);
        }
    }
}
