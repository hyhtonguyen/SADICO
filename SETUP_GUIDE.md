# SADICO CMMS SETUP & DEPLOYMENT GUIDE 🚀

This guide provides step-by-step instructions to set up the database, run the backend (ASP.NET Core 9 or Node.js Express), and launch the frontend (React + Vite) of the **SADICO CMMS** system locally on your machine.

---

## 📌 CONNECTION CONFIGURATION PARAMETERS (REQUIRED)
*   **Database Server:** Microsoft SQL Server 2016 or higher
*   **Your Local Server Address:** `192.168.1.2,1435`
*   **Database Name:** `SADICO_P1`
*   **User ID (SA):** `sa`
*   **Password:** `123456`

---

## STEP 1: SET UP THE DATABASE (SQL SERVER)

You need to initialize the table structures and seed default SADICO testing data on your SQL Server instance.

1.  Open **SQL Server Management Studio (SSMS)** or Azure Data Studio.
2.  Connect to your SQL Server engine:
    *   **Server name:** `192.168.1.2,1435` (or `localhost,1435` if running directly on the local instance).
    *   **Authentication:** SQL Server Authentication.
    *   **Login:** `sa`
    *   **Password:** `123456`
3.  Open the SQL script located in the repository at:
    👉 **`/src/database/schema.sql`**
4.  Copy the entire content, paste it into a **New Query** window in SSMS.
5.  Click **Execute** (or press **F5**).
    *   *Expected Result:* The system will drop/create the `SADICO_P1` database, provision all relational tables (`Users`, `Devices`, `Parts`, `WorkOrders`, `WorkOrderParts`, `MaterialRequests`, `MaterialRequestItems`, `AuditLogs`), set up correct foreign key constraints, and seed rich demo data.

---

## STEP 2: CONFIGURE & LAUNCH THE BACKEND (2 OPTIONS)

The repository provides both **C# ASP.NET Core 9** (for production with SQL Server integration) and **Node.js Express** (for lightweight local mock testing).

### OPTION A: Run C# ASP.NET Core 9 Web API Backend (Recommended)
This backend connects directly to your physical SQL Server using Entity Framework Core.

1.  Prerequisites:
    *   Download and install the official **.NET 9.0 SDK** from Microsoft.
2.  Check the configuration string in the configuration file:
    👉 **`/backend-csharp/appsettings.json`**
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Server=192.168.1.2,1435;Database=SADICO_P1;User Id=sa;Password=123456;TrustServerCertificate=True;MultipleActiveResultSets=True"
      }
    }
    ```
3.  Open your terminal at the **`/backend-csharp`** folder and execute:
    ```bash
    # Restore NuGet packages
    dotnet restore

    # Run the application
    dotnet run
    ```
    *   The Web API will launch and listen on `http://localhost:5000` or `https://localhost:5001`.
    *   On startup, it will call `context.Database.EnsureCreated()` to automatically verify the connection and seed any missing records.

---

### OPTION B: Run Node.js Express Backend
For lightweight development with mock JSON state files:

1.  Install **Node.js LTS** (version 18 or 20).
2.  Create a **`.env`** file in the root directory (copying from `.env.example` in the project):
    ```env
    PORT=3000
    NODE_ENV=development
    
    # DB configuration variables for reference
    DB_SERVER="192.168.1.2"
    DB_PORT=1435
    DB_DATABASE="SADICO_P1"
    DB_USER="sa"
    DB_PASSWORD="123456"
    ```
3.  Run the following commands in the project root:
    ```bash
    # Install dependencies
    npm install

    # Start Vite + Express development server
    npm run dev
    ```

---

## STEP 3: CONFIGURE & LAUNCH THE FRONTEND (REACT CLIENT)

1.  If you choose to run **Backend C# ASP.NET Core** (listening on `http://localhost:5000`):
    *   Set up a Vite proxy in your **`vite.config.ts`** to forward client `/api/*` requests to your .NET Core API.
    *   Add the proxy configuration to `vite.config.ts`:
        ```typescript
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:5000', // ASP.NET Core API Port
              changeOrigin: true,
              secure: false
            }
          }
        }
        ```
2.  Open your terminal in the root directory and install node modules:
    ```bash
    npm install
    ```
3.  Launch the React client:
    ```bash
    npm run dev
    ```
4.  Navigate to:
    👉 **`http://localhost:3000`** in your browser.

---

## STEP 4: RETRIEVING API KEYS & SERVICE CREDENTIALS

### 1. Gemini AI API Key
The system integrates AI to analyze machine error logs, propose solutions, and auto-classify warehouse materials.
*   **How to retrieve:**
    1.  Go to [Google AI Studio](https://aistudio.google.com/).
    2.  Sign in with your Google Account.
    3.  Click **"Get API Key"** and then select **"Create API Key"**.
    4.  Copy the generated key (looks like `AIzaSy...`).
*   **How to configure:**
    *   Add it to your environment `.env` file:
        ```env
        GEMINI_API_KEY="YOUR_KEY_HERE"
        ```

### 2. File & Image Storage (MinIO S3 / Cloudinary)
We recommend hosting images on a dedicated asset server rather than raw Base64 injection to keep your SQL Server lightweight.
*   **MinIO Configuration (Recommended for Sadico Intranet):**
    *   Host MinIO container on `192.168.1.2:9000`.
    *   Create a bucket named `sadico-cmms-images`.
    *   Add your credentials to `appsettings.json` for automatic upload handling.
*   **Cloudinary Configuration (Cloud-based storage):**
    *   Register a free account at [Cloudinary.com](https://cloudinary.com/).
    *   Retrieve your `CloudName`, `ApiKey`, and `ApiSecret` and add them to your backend environment settings.

---

## 🏆 DEFAULT TESTING CREDENTIALS
Role-Based Access Control is enforced through the login interface. Use these credentials to test different interfaces:

| Username | Password | Full Name | Role & Permission Scope |
| :--- | :--- | :--- | :--- |
| **`codien1`** | `sadico123` | Nguyễn Văn Hùng | **Maintenance Tech (Cơ điện)**: Submit maintenance logs, update work status, consume spare parts. |
| **`vattu1`** | `sadico123` | Lê Thị Lan | **Warehouse Team (Vật tư)**: Manage warehouse stock levels, approve procurement receipts. |
| **`truongca1`** | `sadico123` | Trần Minh Đức | **Shift Leader (Trưởng ca)**: Accept/Decline field fault reports, authorize emergency orders. |
| **`lanhdao1`** | `sadico123` | Phạm Việt Hoàng | **Board of Directors**: Monitor KPI dashboards, analyze total costs, approve heavy budgets. |

---

*Good luck with your deployment! If you encounter connection issues, verify your Windows Firewall has port 1435 open on host 192.168.1.2.*
