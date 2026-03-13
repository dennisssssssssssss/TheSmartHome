# 🏠 SmartHome Manager Dashboard

A modern, real-time, and secure web application for managing smart home devices, built with **ASP.NET Core** and **Vanilla JavaScript**. This project demonstrates a full-stack implementation using industry-standard practices such as Clean Architecture, Real-Time WebSockets, and JWT Authentication.

## ✨ Key Features

- **Clean Architecture:** Separation of concerns using Repository and Service patterns for highly maintainable and testable code.
- **Real-Time Synchronization:** Live updates across all connected clients using **SignalR** (e.g., toggling a device instantly updates the UI on other tabs/devices).
- **Robust Security:** Full endpoint protection using **JSON Web Tokens (JWT)**, complete with a custom login flow and local storage token management.
- **Automated Data Seeding:** Zero-configuration startup. The application automatically creates an **SQLite** database and populates it with realistic demo data (rooms and devices) on the first run.
- **Advanced Logging:** Enterprise-grade logging implemented with **Serilog**, configured with rolling file sinks and a Global Exception Handling Middleware to gracefully catch and log fatal errors.
- **Responsive UI:** A modern, dark-themed dashboard built with HTML5, vanilla JavaScript, and **TailwindCSS**.

## 🧠 Technical Highlights & Challenges Solved

- **Cross-Browser Date Parsing (Firefox vs. Chrome):** Identified and resolved a subtle serialization bug where Firefox handled `<input type="datetime-local">` data differently than Chromium-based browsers. Implemented a robust timezone-aware parsing strategy in the backend to ensure automation rules trigger accurately regardless of the user's browser.
- **Silent Crash Handling:** Configured early-stage application bootstrapping to catch and log startup exceptions (e.g., missing JWT configuration keys) before the Kestrel server spins up, preventing silent container failures.

## 🛠️ Tech Stack

### Backend
- C# / .NET Core
- Entity Framework Core (SQLite)
- SignalR (WebSockets)
- JWT (Authentication/Authorization)
- Serilog (Structured Logging)

### Frontend
- HTML5 / Vanilla JavaScript
- Fetch API (Asynchronous HTTP requests)
- TailwindCSS (Utility-first styling)

## 🚀 Getting Started

Follow these steps to run the application locally.

### Prerequisites
- [.NET SDK](https://dotnet.microsoft.com/download) installed.
- Visual Studio 2022 or Visual Studio Code.

### Installation & Execution

**1. Clone the repository:**
```bash
git clone [https://github.com/dennisssssssssssss/smarthome-manager.git](https://github.com/dennisssssssssssss/smarthome-manager.git)
cd smarthome-manager
```

**2. Run the application:**
Open the solution in Visual Studio and press `F5` (or run `dotnet run` via the CLI).

**3. Database & Seeding:**
The SQLite database (`smarthome.db`) will be automatically generated and seeded in the root directory upon the first execution. 

**4. Access the Dashboard:**
Open your browser and navigate to `http://localhost:5000` (or the port specified in your console).

### 🔐 Demo Credentials
To explore the secured dashboard, use the following built-in credentials:
- **Username:** `admin`
- **Password:** `assist2026`

## 📂 Project Structure Highlights

- `/Controllers` - API Endpoints secured with `[Authorize]`.
- `/Hubs` - SignalR hubs for real-time bi-directional communication.
- `/Middleware` - Custom Global Exception Handler.
- `/Services` & `/Repositories` - Core business logic and database access layers.
- `/wwwroot` - Static frontend files (`index.html`, assets).

---
*Developed as a portfolio project showcasing modern .NET full-stack capabilities.*
