using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceIntegrationMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Devices",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Endpoint",
                table: "Devices",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalDeviceId",
                table: "Devices",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntegrationProtocol",
                table: "Devices",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "simulated");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenUtc",
                table: "Devices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Manufacturer",
                table: "Devices",
                type: "TEXT",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Model",
                table: "Devices",
                type: "TEXT",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Transport",
                table: "Devices",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE Devices
                SET Category = CASE
                    WHEN Tip = 'Lampa' THEN 'lighting'
                    WHEN Tip = 'Priza' THEN 'energy'
                    WHEN Tip = 'Termostat' THEN 'climate'
                    WHEN Tip = 'Aer Conditionat' THEN 'climate'
                    WHEN Tip = 'Tv' THEN 'entertainment'
                    WHEN Tip = 'Boxa' THEN 'entertainment'
                    WHEN Tip = 'Camera' THEN 'security'
                    WHEN Tip = 'Incuietoare' THEN 'access'
                    WHEN Tip = 'Senzor' THEN 'sensing'
                    WHEN Tip = 'Jaluzele' THEN 'comfort'
                    ELSE 'general'
                END
                WHERE Category = '';
                """);

            migrationBuilder.Sql("""
                UPDATE Devices
                SET IntegrationProtocol = 'simulated'
                WHERE IntegrationProtocol = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "Endpoint",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "ExternalDeviceId",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "IntegrationProtocol",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "LastSeenUtc",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "Manufacturer",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "Model",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "Transport",
                table: "Devices");
        }
    }
}
