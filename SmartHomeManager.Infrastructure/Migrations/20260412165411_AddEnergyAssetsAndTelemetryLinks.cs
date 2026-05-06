using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEnergyAssetsAndTelemetryLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EnergyAssetId",
                table: "EnergyTelemetrySamples",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EnergyAssets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SourceType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IntegrationProtocol = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ExternalAssetId = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Manufacturer = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    Model = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnergyAssets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EnergyTelemetrySamples_EnergyAssetId",
                table: "EnergyTelemetrySamples",
                column: "EnergyAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_EnergyAssets_IntegrationProtocol_ExternalAssetId",
                table: "EnergyAssets",
                columns: new[] { "IntegrationProtocol", "ExternalAssetId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_EnergyTelemetrySamples_EnergyAssets_EnergyAssetId",
                table: "EnergyTelemetrySamples",
                column: "EnergyAssetId",
                principalTable: "EnergyAssets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EnergyTelemetrySamples_EnergyAssets_EnergyAssetId",
                table: "EnergyTelemetrySamples");

            migrationBuilder.DropTable(
                name: "EnergyAssets");

            migrationBuilder.DropIndex(
                name: "IX_EnergyTelemetrySamples_EnergyAssetId",
                table: "EnergyTelemetrySamples");

            migrationBuilder.DropColumn(
                name: "EnergyAssetId",
                table: "EnergyTelemetrySamples");
        }
    }
}
