-- ====================================================================================
-- SYSTEM: SADICO CMMS (Hệ thống Điều hành Bảo trì Thiết bị & Vật tư Kho)
-- DATABASE SCRIPT FOR MICROSOFT SQL SERVER 2016+
-- Target Database Name: SADICO_P1
-- Local Connection String: Server=192.168.1.157,1435;Database=SADICO_P1;User Id=sa;Password=123456;TrustServerCertificate=True
-- ====================================================================================

USE [master];
GO

-- 1. Create Database if not exists
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'SADICO_P1')
BEGIN
    ALTER DATABASE [SADICO_P1] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [SADICO_P1];
END
GO

CREATE DATABASE [SADICO_P1];
GO

USE [SADICO_P1];
GO

-- ====================================================================================
-- SECTION 1: CREATE TABLES
-- ====================================================================================

-- A0. Roles Table (Bảng Vai trò / Phân quyền nâng cao)
CREATE TABLE [dbo].[Roles] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL UNIQUE,
    [Description] NVARCHAR(250) NULL,
    [CanManageDevices] BIT NOT NULL DEFAULT 0,
    [CanManageWorkOrders] BIT NOT NULL DEFAULT 0,
    [CanManageParts] BIT NOT NULL DEFAULT 0,
    [CanManageMaterials] BIT NOT NULL DEFAULT 0,
    [CanManageUsers] BIT NOT NULL DEFAULT 0,
    [CanViewAuditLogs] BIT NOT NULL DEFAULT 1
);
GO

-- A. Users Table (Bảng Người dùng / Phân quyền)
CREATE TABLE [dbo].[Users] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(50) NOT NULL UNIQUE,
    [Password] NVARCHAR(100) NOT NULL DEFAULT '123456',
    [Name] NVARCHAR(150) NOT NULL,
    [RoleId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[Roles]([Id]),
    [Role] NVARCHAR(100) NOT NULL, -- Hỗ trợ tương thích ngược
    [Dept] NVARCHAR(100) NOT NULL
);
GO

-- B. Devices Table (Bảng Thiết bị nhà máy)
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
    [Status] NVARCHAR(50) NOT NULL DEFAULT N'Đang hoạt động', -- 'Đang hoạt động', 'Đang bảo trì', 'Hỏng', 'Sắp đến hạn bảo trì'
    [LastMaintenance] DATE NULL,
    [CycleDays] INT NOT NULL DEFAULT 30
);
GO

-- C. Parts Table (Bảng Linh kiện / Vật tư kho)
CREATE TABLE [dbo].[Parts] (
    [Code] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(250) NOT NULL,
    [Serial] NVARCHAR(100) NULL,
    [Category] NVARCHAR(100) NOT NULL, -- 'Vật tư sửa chữa', 'Vật tư Trung tâm sản xuất'
    [Stock] INT NOT NULL DEFAULT 0,
    [MinStock] INT NOT NULL DEFAULT 10,
    [LifecycleMonths] INT NOT NULL DEFAULT 12,
    [Unit] NVARCHAR(50) NOT NULL DEFAULT N'Cái',
    [Price] DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    [Origin] NVARCHAR(100) NULL,
    [Color] NVARCHAR(50) NULL,
    [DeviceId] NVARCHAR(50) NULL FOREIGN KEY REFERENCES [dbo].[Devices]([Id]) ON DELETE SET NULL
);
GO

-- D. WorkOrders Table (Phiếu yêu cầu / Phiếu sửa chữa bảo trì)
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
    [ImageBefore] NVARCHAR(MAX) NULL, -- Lưu trữ link ảnh base64 hoặc URL
    [ImageAfter] NVARCHAR(MAX) NULL,  -- Lưu trữ link ảnh base64 hoặc URL
    [ProposedSolution] NVARCHAR(MAX) NULL,
    [TargetCompletion] DATE NULL,
    [Technician] NVARCHAR(100) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT N'Sẵn sàng thực hiện', -- 'Nháp', 'Chờ duyệt', 'Chờ vật tư', 'Sẵn sàng thực hiện', 'Đang sửa chữa', 'Hoàn thành', 'Đóng phiếu'
    [Notes] NVARCHAR(MAX) NULL,
    [RecoveredMaterials] NVARCHAR(MAX) NULL,
    [ApprovalDate] DATE NULL,
    [ApprovedBy] NVARCHAR(100) NULL,
    [CompletedDate] DATE NULL,
    [DurationHours] DECIMAL(5, 2) NULL,
    [Cost] DECIMAL(18, 2) NOT NULL DEFAULT 0.00
);
GO

-- E. WorkOrderParts Table (Chi tiết vật tư tiêu hao thực tế cho phiếu sửa chữa)
CREATE TABLE [dbo].[WorkOrderParts] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [WorkOrderId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[WorkOrders]([Id]) ON DELETE CASCADE,
    [PartCode] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [dbo].[Parts]([Code]),
    [PartName] NVARCHAR(250) NOT NULL,
    [Quantity] INT NOT NULL DEFAULT 1
);
GO

-- F. MaterialRequests Table (Đề xuất / Yêu cầu mua sắm vật tư kho)
CREATE TABLE [dbo].[MaterialRequests] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [Date] DATE NOT NULL DEFAULT GETDATE(),
    [Proposer] NVARCHAR(100) NOT NULL,
    [WorkOrderId] NVARCHAR(50) NULL FOREIGN KEY REFERENCES [dbo].[WorkOrders]([Id]) ON DELETE SET NULL,
    [DeviceId] NVARCHAR(50) NULL FOREIGN KEY REFERENCES [dbo].[Devices]([Id]),
    [DeviceName] NVARCHAR(250) NOT NULL,
    [Reason] NVARCHAR(MAX) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT N'Chờ duyệt', -- 'Chờ duyệt', 'Đã duyệt', 'Đang mua hàng', 'Đã giao hàng/Nhập kho', 'Bị từ chối'
    [ApprovedBy] NVARCHAR(100) NULL,
    [ApprovalDate] DATE NULL,
    [ProcurementNotes] NVARCHAR(MAX) NULL,
    [DeliveryDate] DATE NULL,
    [ReceptionDate] DATE NULL,
    [Cost] DECIMAL(18, 2) NOT NULL DEFAULT 0.00
);
GO

-- G. MaterialRequestItems Table (Chi tiết các vật tư cần mua sắm trong một phiếu đề xuất)
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

-- H. AuditLogs Table (Nhật ký thao tác hệ thống)
CREATE TABLE [dbo].[AuditLogs] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Time] DATETIME NOT NULL DEFAULT GETDATE(),
    [User] NVARCHAR(100) NOT NULL,
    [Action] NVARCHAR(150) NOT NULL,
    [Details] NVARCHAR(MAX) NULL
);
GO


-- ====================================================================================
-- SECTION 2: NO SEED DATA
-- ====================================================================================
-- The application now reads data exclusively from SQL Server tables.
-- Add data manually or through the app after the schema is created.

PRINT '=======================================================';
PRINT 'SADICO CMMS DATABASE (SADICO_P1) CREATED SUCCESSFULLY';
PRINT '=======================================================';
GO
