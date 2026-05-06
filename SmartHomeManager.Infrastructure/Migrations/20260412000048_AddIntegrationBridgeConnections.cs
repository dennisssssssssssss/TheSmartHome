using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIntegrationBridgeConnections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IntegrationBridgeConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Protocol = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    BaseUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ApiKey = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    TelemetrySyncEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    TelemetrySyncIntervalMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastTelemetrySyncUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastTelemetrySyncStatus = table.Column<string>(type: "TEXT", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntegrationBridgeConnections", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IntegrationBridgeConnections_Protocol",
                table: "IntegrationBridgeConnections",
                column: "Protocol",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IntegrationBridgeConnections");
        }
    }
}
