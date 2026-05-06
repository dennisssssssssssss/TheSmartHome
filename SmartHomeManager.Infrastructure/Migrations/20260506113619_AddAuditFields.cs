using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Rooms",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Rooms",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Notifications",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Notifications",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "EnergyTelemetrySamples",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "EnergyTelemetrySamples",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Devices",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Devices",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "DeviceEnergyUsages",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "DeviceEnergyUsages",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "AutomationRules",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "AutomationRules",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "AutomationExecutions",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "AutomationExecutions",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ActivityLogs",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "ActivityLogs",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(2026, 5, 6, 11, 36, 19, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "EnergyTelemetrySamples");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "EnergyTelemetrySamples");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "DeviceEnergyUsages");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "DeviceEnergyUsages");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "AutomationRules");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "AutomationRules");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "AutomationExecutions");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "AutomationExecutions");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "ActivityLogs");
        }
    }
}
