import React, { useState } from "react";
import { Copy, Check, FileCode, Server, Cpu, Database, Compass } from "lucide-react";

export default function CsharpSqlCenter() {
  const [activeTab, setActiveTab] = useState<"sql" | "csharp" | "deploy">("sql");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sqlCode = `-- SQL Server Database DDL Script for SADICO_CMMS
-- Target database: Microsoft SQL Server 2016+
-- Server connection string: Server=192.168.1.157,1435;Database=SADICO_CMMS;User Id=sa;Password=123456

USE [master];
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'SADICO_CMMS')
BEGIN
    ALTER DATABASE [SADICO_CMMS] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [SADICO_CMMS];
END
GO

CREATE DATABASE [SADICO_CMMS];
GO

USE [SADICO_CMMS];
GO

-- 1. Devices Table (Thiết bị)
CREATE TABLE [dbo].[Devices] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [Name] NVARCHAR(250) NOT NULL,
    [Model] NVARCHAR(100) NULL,
    [Serial] NVARCHAR(100) NULL,
    [PurchaseDate] DATE NULL,
    [Value] DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    [Location] NVARCHAR(250) NULL,
    [Department] NVARCHAR(100) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Đang hoạt động', -- 'Đang hoạt động', 'Đang bảo trì', 'Hỏng', 'Sắp đến hạn bảo trì'
    [LastMaintenance] DATE NULL,
    [CycleDays] INT NOT NULL DEFAULT 30
);
GO

-- 2. Parts Table (Linh kiện / Kho vật tư)
CREATE TABLE [dbo].[Parts] (
    [Code] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(250) NOT NULL,
    [Serial] NVARCHAR(100) NULL,
    [Category] NVARCHAR(100) NOT NULL, -- 'Vật tư sửa chữa' or 'Vật tư Trung tâm sản xuất'
    [Stock] INT NOT NULL DEFAULT 0,
    [MinStock] INT NOT NULL DEFAULT 10,
    [LifecycleMonths] INT NOT NULL DEFAULT 12,
    [Unit] NVARCHAR(50) NOT NULL DEFAULT 'Cái',
    [Price] DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    [Origin] NVARCHAR(100) NULL,
    [Color] NVARCHAR(50) NULL,
    [DeviceId] NVARCHAR(50) NULL FOREIGN KEY REFERENCES [dbo].[Devices]([Id]) ON DELETE SET NULL
);
GO

-- 3. WorkOrders Table (Phiếu sửa chữa)
CREATE TABLE [dbo].[WorkOrders] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [Date] DATE NOT NULL DEFAULT GETDATE(),
    [Creator] NVARCHAR(100) NOT NULL,
    [Department] NVARCHAR(100) NULL,
    [DeviceId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[Devices]([Id]),
    [DeviceName] NVARCHAR(250) NOT NULL,
    [Location] NVARCHAR(250) NULL,
    [FaultTime] DATETIME NOT NULL,
    [FaultFinder] NVARCHAR(100) NULL,
    [Symptom] NVARCHAR(MAX) NULL,
    [Cause] NVARCHAR(MAX) NULL,
    [ImageBefore] NVARCHAR(MAX) NULL, -- URL to Cloudinary / MinIO
    [ImageAfter] NVARCHAR(MAX) NULL,  -- URL to Cloudinary / MinIO
    [ProposedSolution] NVARCHAR(MAX) NULL,
    [TargetCompletion] DATE NULL,
    [Technician] NVARCHAR(100) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Nháp', -- 'Nháp', 'Chờ duyệt', 'Chờ vật tư', 'Sẵn sàng thực hiện', 'Đang sửa chữa', 'Hoàn thành', 'Đóng phiếu'
    [Notes] NVARCHAR(MAX) NULL,
    [RecoveredMaterials] NVARCHAR(MAX) NULL,
    [ApprovalDate] DATE NULL,
    [ApprovedBy] NVARCHAR(100) NULL,
    [CompletedDate] DATE NULL,
    [DurationHours] DECIMAL(5,2) NULL,
    [Cost] DECIMAL(18,2) NOT NULL DEFAULT 0.00
);
GO

-- 4. WorkOrderParts Table (Linh kiện đã dùng trong phiếu sửa chữa)
CREATE TABLE [dbo].[WorkOrderParts] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [WorkOrderId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[WorkOrders]([Id]) ON DELETE CASCADE,
    [PartCode] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[Parts]([Code]),
    [PartName] NVARCHAR(250) NOT NULL,
    [Quantity] INT NOT NULL DEFAULT 1
);
GO

-- 5. MaterialRequests Table (Phiếu yêu cầu vật tư)
CREATE TABLE [dbo].[MaterialRequests] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [Date] DATE NOT NULL DEFAULT GETDATE(),
    [Proposer] NVARCHAR(100) NOT NULL,
    [WorkOrderId] NVARCHAR(50) NULL FOREIGN KEY REFERENCES [dbo].[WorkOrders]([Id]) ON DELETE SET NULL,
    [DeviceId] NVARCHAR(50) NULL FOREIGN KEY REFERENCES [dbo].[Devices]([Id]),
    [DeviceName] NVARCHAR(250) NOT NULL,
    [Reason] NVARCHAR(MAX) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Chờ duyệt', -- 'Chờ duyệt', 'Đã duyệt', 'Đang mua hàng', 'Đã giao hàng/Nhập kho', 'Bị từ chối'
    [ApprovedBy] NVARCHAR(100) NULL,
    [ApprovalDate] DATE NULL,
    [ProcurementNotes] NVARCHAR(MAX) NULL,
    [DeliveryDate] DATE NULL,
    [ReceptionDate] DATE NULL,
    [Cost] DECIMAL(18,2) NOT NULL DEFAULT 0.00
);
GO

-- 6. MaterialRequestItems Table (Chi tiết vật tư đặt mua)
CREATE TABLE [dbo].[MaterialRequestItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [MaterialRequestId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[MaterialRequests]([Id]) ON DELETE CASCADE,
    [PartCode] NVARCHAR(50) NOT NULL,
    [PartName] NVARCHAR(250) NOT NULL,
    [Quantity] INT NOT NULL DEFAULT 1,
    [Unit] NVARCHAR(50) NULL,
    [Reason] NVARCHAR(MAX) NULL
);
GO

-- 7. AuditLogs Table (Nhật ký hệ thống)
CREATE TABLE [dbo].[AuditLogs] (
    [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [Time] DATETIME NOT NULL DEFAULT GETDATE(),
    [User] NVARCHAR(100) NOT NULL,
    [Action] NVARCHAR(150) NOT NULL,
    [Details] NVARCHAR(MAX) NULL
);
GO

-- Seed sample data for SADICO testing
INSERT INTO [dbo].[Devices] ([Id], [Code], [Name], [Model], [Serial], [PurchaseDate], [Value], [Location], [Department], [Status], [LastMaintenance], [CycleDays])
VALUES 
('DEV-001', 'DEV-001', N'Máy đóng bao xi măng Haver & Boecker 8 vòi', 'HB-ROTO-8', 'SN-99812-HB', '2022-03-15', 1250000000, N'Khu vực đóng gói xi măng', N'Xưởng đóng bao', N'Đang hoạt động', '2026-05-10', 60),
('DEV-002', 'DEV-002', N'Hệ thống cấp liệu băng tải xích clinker', 'SADICO-CH-1200', 'SN-2021-SAD-55', '2021-08-20', 750000000, N'Khu vực lò nung clinker', N'Xưởng clinker', N'Đang hoạt động', '2026-06-01', 30);
`;

  const csharpCode = `// ASP.NET Core 9 Model & API Controller Templates
// Target: .NET 9 Web API + Entity Framework Core + SQL Server

// 1. Models/Device.cs
namespace SadicoCmms.Models
{
    public class Device
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Model { get; set; }
        public string? Serial { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal Value { get; set; }
        public string? Location { get; set; }
        public string? Department { get; set; }
        public string Status { get; set; } = "Đang hoạt động";
        public DateTime? LastMaintenance { get; set; }
        public int CycleDays { get; set; } = 30;
    }
}

// 2. Data/CmmsDbContext.cs
using Microsoft.EntityFrameworkCore;
using SadicoCmms.Models;

namespace SadicoCmms.Data
{
    public class CmmsDbContext : DbContext
    {
        public CmmsDbContext(DbContextOptions<CmmsDbContext> options) : base(options) { }

        public DbSet<Device> Devices { get; set; }
        public DbSet<Part> Parts { get; set; }
        public DbSet<WorkOrder> WorkOrders { get; set; }
        public DbSet<WorkOrderPart> WorkOrderParts { get; set; }
        public DbSet<MaterialRequest> MaterialRequests { get; set; }
        public DbSet<MaterialRequestItem> MaterialRequestItems { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Map configuration or keys if necessary
            modelBuilder.Entity<WorkOrderPart>()
                .HasOne<WorkOrder>()
                .WithMany()
                .HasForeignKey(p => p.WorkOrderId);
        }
    }
}

// 3. Controllers/WorkOrdersController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SadicoCmms.Data;
using SadicoCmms.Models;

namespace SadicoCmms.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkOrdersController : ControllerBase
    {
        private readonly CmmsDbContext _context;

        public WorkOrdersController(CmmsDbContext context)
        {
            _context = context;
        }

        // GET: api/WorkOrders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkOrder>>> GetWorkOrders()
        {
            return await _context.WorkOrders.OrderByDescending(w => w.Date).ToListAsync();
        }

        // POST: api/WorkOrders - Create new Work Order
        [HttpPost]
        public async Task<ActionResult<WorkOrder>> CreateWorkOrder(WorkOrder workOrder)
        {
            _context.WorkOrders.Add(workOrder);
            
            // Write Audit Log
            _context.AuditLogs.Add(new AuditLog 
            {
                Time = DateTime.UtcNow,
                User = workOrder.Creator,
                Action = "Tạo phiếu sửa chữa",
                Details = $"Đã tạo phiếu sửa chữa {workOrder.Code} cho thiết bị {workOrder.DeviceName}"
            });

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWorkOrders), new { id = workOrder.Id }, workOrder);
        }

        // PUT: api/WorkOrders/WO-123 - Process State Machine & Inventory Auto Deduct
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkOrder(string id, WorkOrder updatedOrder)
        {
            if (id != updatedOrder.Id) return BadRequest();

            var existingOrder = await _context.WorkOrders.FindAsync(id);
            if (existingOrder == null) return NotFound();

            // Track state transitions (e.g. from any state to Completed or Closed)
            bool isNowCompleted = (updatedOrder.Status == "Hoàn thành" || updatedOrder.Status == "Đóng phiếu");
            bool wasAlreadyCompleted = (existingOrder.Status == "Hoàn thành" || existingOrder.Status == "Đóng phiếu");

            if (isNowCompleted && !wasAlreadyCompleted)
            {
                // Dynamic Inventory Deduct Logic in C#
                var woParts = await _context.WorkOrderParts
                    .Where(p => p.WorkOrderId == id).ToListAsync();

                foreach (var item in woParts)
                {
                    var part = await _context.Parts.FindAsync(item.PartCode);
                    if (part != null)
                    {
                        part.Stock = Math.Max(0, part.Stock - item.Quantity);
                        
                        _context.AuditLogs.Add(new AuditLog
                        {
                            Time = DateTime.UtcNow,
                            User = "System Engine",
                            Action = "Tự động xuất kho",
                            Details = $"Trừ kho {part.Name} (-{item.Quantity} {part.Unit}) do hoàn thành phiếu {updatedOrder.Code}"
                        });
                    }
                }

                // Restore device to Active state
                var device = await _context.Devices.FindAsync(updatedOrder.DeviceId);
                if (device != null)
                {
                    device.Status = "Đang hoạt động";
                    device.LastMaintenance = DateTime.Today;
                }
            }

            // Copy values and save
            _context.Entry(existingOrder).CurrentValues.SetValues(updatedOrder);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
`;

  const deployInstructions = `CẤU HÌNH & TRIỂN KHAI HỆ THỐNG CMMS SADICO

1. Thiết lập Database SQL Server:
   - Sử dụng SQL Server Management Studio (SSMS).
   - Kết nối tới địa chỉ máy chủ: 192.168.1.157, Port: 1435.
   - Chạy tập lệnh SQL trong tab "Kịch bản SQL DDL" để khởi tạo cấu trúc cơ sở dữ liệu và các bảng liên kết ràng buộc toàn vẹn.

2. Cấu hình Connection String trong ASP.NET Core:
   - Mở file 'appsettings.json' trong dự án Backend ASP.NET và khai báo chuỗi kết nối:
   
   "ConnectionStrings": {
     "DefaultConnection": "Server=192.168.1.157,1435;Database=SADICO_CMMS;User Id=sa;Password=123456;TrustServerCertificate=True;MultipleActiveResultSets=True"
   }

3. Quản lý Hình ảnh (Cloudinary / MinIO S3):
   - Thay vì lưu trực tiếp Base64 vào database gây phình kích thước, hãy viết một Controller Proxy nhận ảnh từ Client, upload lên dịch vụ MinIO nội bộ hoặc Cloudinary cloud, nhận về URL ảnh dạng HTTPS và lưu URL đó vào trường [ImageBefore]/[ImageAfter] của bảng [WorkOrders].
   - API cấu hình MinIO Client trong ASP.NET 9:
     builder.Services.AddMinio(configure => configure
         .WithEndpoint("192.168.1.157:9000")
         .WithCredentials("ACCESS_KEY", "SECRET_KEY")
         .WithSSL(false));

4. Deploy trên Máy chủ IIS (Internet Information Services):
   - Đảm bảo máy chủ cài đặt .NET Core Hosting Bundle phiên bản 9.0.
   - Publish dự án Backend: 'dotnet publish -c Release -o C:\\publish\\sadico_api'.
   - Mở IIS Manager, click chuột phải vào 'Sites' -> 'Add Website'.
   - Điền tên Site 'SadicoCMMS', chọn đường dẫn vật lý trỏ tới thư mục publish.
   - Đặt Port cho API (ví dụ 5000) và Bind IP tương ứng.
   - Cấp quyền 'Read & Write' cho tài khoản 'IIS_IUSRS' trên thư mục publish để lưu trữ file log tĩnh nếu có.

5. Triển khai ứng dụng Web Client (React PWA):
   - Build ứng dụng React thành tài nguyên tĩnh: 'npm run build'.
   - Copy nội dung trong thư mục 'dist/' sang thư mục gốc của website trên IIS (ví dụ Port 80 hoặc 443) hoặc deploy song song với ASP.NET dưới dạng sub-folder / SPA Fallback.
`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="csharp-sql-center-component">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Trung tâm Mã nguồn & Triển khai SADICO</h2>
            <p className="text-sm text-slate-300">
              Cung cấp các mã lệnh SQL Server DDL và mã ASP.NET Core 9 chuẩn hóa để kết nối hệ thống trực tiếp lên hạ tầng của Sadico
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-slate-50 p-2 gap-2">
        <button
          onClick={() => setActiveTab("sql")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "sql"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
          id="tab-btn-sql"
        >
          <Database className="w-4 h-4" />
          Kịch bản SQL DDL (SQL Server)
        </button>

        <button
          onClick={() => setActiveTab("csharp")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "csharp"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
          id="tab-btn-csharp"
        >
          <FileCode className="w-4 h-4" />
          C# ASP.NET Core 9 API
        </button>

        <button
          onClick={() => setActiveTab("deploy")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === "deploy"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
          id="tab-btn-deploy"
        >
          <Compass className="w-4 h-4" />
          Hướng dẫn Deploy IIS & S3
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === "sql" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-semibold text-slate-800 text-base">Kịch bản tạo Database (SADICO_CMMS)</span>
                <p className="text-xs text-gray-500">Mã lệnh SQL chạy trực tiếp trên SQL Server 2016-2022 để cấu hình bảng</p>
              </div>
              <button
                onClick={() => handleCopy(sqlCode, "sql")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                id="btn-copy-sql"
              >
                {copied === "sql" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "sql" ? "Đã sao chép!" : "Sao chép SQL"}
              </button>
            </div>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-96 border border-slate-800 leading-relaxed">
                {sqlCode}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "csharp" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-semibold text-slate-800 text-base">Mô hình dữ liệu và Controller (ASP.NET Core 9)</span>
                <p className="text-xs text-gray-500">Mã nguồn C# tích hợp Entity Framework Core hỗ trợ State Machine</p>
              </div>
              <button
                onClick={() => handleCopy(csharpCode, "csharp")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                id="btn-copy-csharp"
              >
                {copied === "csharp" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "csharp" ? "Đã sao chép!" : "Sao chép mã C#"}
              </button>
            </div>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-96 border border-slate-800 leading-relaxed">
                {csharpCode}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "deploy" && (
          <div className="prose max-w-none text-slate-600">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Hướng dẫn triển khai hệ thống vật lý
              </span>
              <button
                onClick={() => handleCopy(deployInstructions, "deploy")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                id="btn-copy-deploy"
              >
                {copied === "deploy" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "deploy" ? "Đã sao chép!" : "Sao chép Hướng dẫn"}
              </button>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 p-4 rounded-xl mb-4 text-sm leading-relaxed">
              <strong>💡 Thông tin máy chủ lưu trữ dữ liệu Sadico:</strong> Hệ thống lưu trữ cơ sở dữ liệu trên máy chủ nội bộ <code>192.168.1.157</code> cổng <code>1435</code>. Việc phân quyền vai trò sẽ đồng nhất với token JWT được cấu hình qua Middleware của Web API trên IIS.
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-sans text-slate-700">
              {deployInstructions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
