using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEnergyTelemetrySamples : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EnergyTelemetrySamples",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SourceType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PowerWatts = table.Column<double>(type: "REAL", nullable: false),
                    EnergyDeltaWh = table.Column<double>(type: "REAL", nullable: false),
                    Voltage = table.Column<double>(type: "REAL", nullable: true),
                    CurrentAmps = table.Column<double>(type: "REAL", nullable: true),
                    StateOfChargePercent = table.Column<double>(type: "REAL", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnergyTelemetrySamples", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnergyTelemetrySamples");
        }
    }
}
