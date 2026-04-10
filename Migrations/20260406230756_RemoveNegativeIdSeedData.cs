using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SmartHomeManager.Migrations
{
    /// <inheritdoc />
    public partial class RemoveNegativeIdSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: -101);

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: -100);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Devices",
                columns: new[] { "Id", "EstePornit", "Nume", "RoomId", "SensorUnit", "SensorValue", "Tip", "Valoare" },
                values: new object[,]
                {
                    { -101, true, "Umiditate Aer", null, "%", 45.0, "Sensor", 0.0 },
                    { -100, true, "Senzor Climă", null, "°C", 22.5, "Sensor", 0.0 }
                });
        }
    }
}
