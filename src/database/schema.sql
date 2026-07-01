-- ====================================================================================
-- SYSTEM: SADICO CMMS (Hệ thống Điều hành Bảo trì Thiết bị & Vật tư Kho)
-- DATABASE SCRIPT FOR MICROSOFT SQL SERVER 2016+
-- Target Database Name: SADICO_P1
-- Local Connection String: Server=192.168.1.2,1435;Database=SADICO_P1;User Id=sa;Password=123456;TrustServerCertificate=True
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
-- SECTION 2: SEED INITIAL DATA (Dữ liệu mẫu chuẩn SADICO)
-- ====================================================================================

-- 0. Seed Roles
INSERT INTO [dbo].[Roles] ([Id], [Name], [Description], [CanManageDevices], [CanManageWorkOrders], [CanManageParts], [CanManageMaterials], [CanManageUsers], [CanViewAuditLogs])
VALUES
('codien', N'Kỹ thuật bảo trì (Cơ điện)', N'Kỹ thuật viên thực tế', 1, 1, 0, 0, 0, 1),
('vattu', N'Bộ phận Vật tư', N'Quản lý tồn kho & mua sắm', 0, 0, 1, 1, 0, 1),
('truongca', N'Trưởng ca', N'Giám sát & Phê duyệt sửa chữa/vật tư', 1, 1, 1, 1, 0, 1),
('lanhdao', N'Ban lãnh đạo', N'Toàn quyền hệ thống & Phân quyền', 1, 1, 1, 1, 1, 1);
GO

-- 1. Seed Users
INSERT INTO [dbo].[Users] ([Id], [Username], [Password], [Name], [RoleId], [Role], [Dept])
VALUES 
('u1', 'codien1', '123456', N'Nguyễn Văn Hùng', 'codien', N'Kỹ thuật bảo trì (Cơ điện)', N'Tổ Cơ điện'),
('u2', 'vattu1', '123456', N'Lê Thị Lan', 'vattu', N'Bộ phận Vật tư', N'Phòng Vật tư'),
('u3', 'truongca1', '123456', N'Trần Minh Đức', 'truongca', N'Trưởng ca', N'Ban Quản lý Sản xuất'),
('u4', 'lanhdao1', '123456', N'Phạm Việt Hoàng', 'lanhdao', N'Ban lãnh đạo', N'Ban Giám đốc');
GO

-- 2. Seed Devices
INSERT INTO [dbo].[Devices] ([Id], [Code], [Name], [Model], [Serial], [PurchaseDate], [Value], [Location], [Department], [Status], [LastMaintenance], [CycleDays])
VALUES 
('DEV-001', 'DEV-001', N'Máy đóng bao xi măng Haver & Boecker 8 vòi', 'HB-ROTO-8', 'SN-99812-HB', '2022-03-15', 1250000000.00, N'Khu vực đóng gói xi măng', N'Xưởng đóng bao', N'Đang hoạt động', '2026-05-10', 60),
('DEV-002', 'DEV-002', N'Hệ thống cấp liệu băng tải xích clinker', 'SADICO-CH-1200', 'SN-2021-SAD-55', '2021-08-20', 750000000.00, N'Khu vực lò nung clinker', N'Xưởng clinker', N'Đang hoạt động', '2026-06-01', 30),
('DEV-003', 'DEV-003', N'Máy nén khí trục vít Atlas Copco GA75', 'GA75-VSD', 'AC-VSD-750912', '2023-01-10', 480000000.00, N'Trạm khí nén trung tâm', N'Tổ Cơ điện hỗ trợ', N'Đang bảo trì', '2026-04-20', 90),
('DEV-004', 'DEV-004', N'Gầu tải liệu đá vôi nâng đứng', 'GT-LIME-50T', 'GT-LIME-1029', '2020-05-18', 320000000.00, N'Kho nguyên liệu đá vôi', N'Xưởng chuẩn bị liệu', N'Hỏng', '2026-03-05', 45),
('DEV-005', 'DEV-005', N'Hệ thống quạt hút lọc bụi lò quay số 1', 'EP-DUST-F180', 'SN-EP-F180-22', '2022-11-05', 920000000.00, N'Hệ thống lọc bụi tĩnh điện lò quay', N'Xưởng lò nung', N'Sắp đến hạn bảo trì', '2026-05-01', 60);
GO

-- 3. Seed Parts
INSERT INTO [dbo].[Parts] ([Code], [Name], [Serial], [Category], [Stock], [MinStock], [LifecycleMonths], [Unit], [Price], [Origin], [Color], [DeviceId])
VALUES 
('PART-V01', N'Van khí nén 5/2 SMC điện từ', 'SMC-SY5120-5D', N'Vật tư sửa chữa', 12, 10, 18, N'Cái', 1500000.00, N'Nhật Bản', N'Xám bạc', 'DEV-001'),
('PART-B02', N'Vòng bi SKF Explorer 22212', 'SKF-22212-E', N'Vật tư sửa chữa', 4, 8, 24, N'Bộ', 3200000.00, N'Thụy Điển', N'Thép sáng', 'DEV-002'),
('PART-G03', N'Dầu hộp số công nghiệp Shell Omala S2 G220', 'SHELL-OMALA-220', N'Vật tư Trung tâm sản xuất', 15, 5, 12, N'Thùng (20L)', 2400000.00, N'Singapore', N'Vàng hổ phách', 'DEV-003'),
('PART-S04', N'Cảm biến tiệm cận Autonics PR12-4DN', 'AUTO-PR12', N'Vật tư sửa chữa', 25, 10, 36, N'Cái', 450000.00, N'Hàn Quốc', N'Đen', 'DEV-001'),
('PART-C05', N'Dây curoa răng truyền động bản rộng Gates 8M-1200', 'GATES-8M-1200', N'Vật tư Trung tâm sản xuất', 2, 10, 12, N'Sợi', 850000.00, N'Mỹ', N'Đen tuyền', 'DEV-004');
GO

-- 4. Seed WorkOrders
INSERT INTO [dbo].[WorkOrders] ([Id], [Code], [Date], [Creator], [Department], [DeviceId], [DeviceName], [Location], [FaultTime], [FaultFinder], [Symptom], [Cause], [ImageBefore], [ImageAfter], [ProposedSolution], [TargetCompletion], [Technician], [Status], [Notes], [RecoveredMaterials], [ApprovalDate], [ApprovedBy], [CompletedDate], [DurationHours], [Cost])
VALUES 
('WO-260601', 'WO-260601', '2026-06-25', N'Nguyễn Văn Hùng', N'Tổ Cơ điện', 'DEV-004', N'Gầu tải liệu đá vôi nâng đứng', N'Kho nguyên liệu đá vôi', '2026-06-25 08:30:00', N'Trần Minh Đức (Trưởng ca)', N'Đứt xích truyền động, gầu bị kẹt cứng không thể vận hành cấp liệu.', N'Dây curoa / xích truyền động Gates bị mài mòn quá hạn chưa được thay thế kịp thời.', '', '', N'Kiểm tra gầu tải, tháo gỡ phần bị kẹt, thay thế dây curoa mới và bôi trơn hệ thống xích nâng.', '2026-06-30', N'Nguyễn Văn Hùng', N'Chờ vật tư', N'Đang chờ mua bổ sung Dây curoa Gates 8M-1200 từ phòng vật tư do số lượng tồn kho chỉ còn 2 sợi (mức tối thiểu là 10).', N'Xích truyền động cũ và dây curoa hỏng thu hồi về kho vật tư tái chế.', '2026-06-25', N'Trần Minh Đức', NULL, 0.00, 1700000.00),
('WO-260602', 'WO-260602', '2026-06-28', N'Nguyễn Văn Hùng', N'Tổ Cơ điện', 'DEV-001', N'Máy đóng bao xi măng Haver & Boecker 8 vòi', N'Khu vực đóng gói xi măng', '2026-06-28 09:15:00', N'Nguyễn Văn Hùng', N'Vòi phun số 3 cấp liệu không đều, cảm biến tiệm cận lúc nhận lúc không.', N'Cảm biến tiệm cận Autonics PR12 bị lệch vị trí lắp đặt và mờ thấu kính.', '', '', N'Cân chỉnh khoảng cách lắp đặt cảm biến, vệ sinh thấu kính. Nếu không khắc phục được thì thay mới.', '2026-06-29', N'Nguyễn Văn Hùng', N'Sẵn sàng thực hiện', N'Linh kiện cảm biến Autonics PR12 có sẵn trong kho 25 cái, có thể thực hiện ngay.', N'Cảm biến tiệm cận cũ mờ hỏng.', '2026-06-28', N'Trần Minh Đức', NULL, 0.00, 450000.00),
('WO-260603', 'WO-260603', '2026-06-05', N'Nguyễn Văn Hùng', N'Tổ Cơ điện', 'DEV-002', N'Hệ thống cấp liệu băng tải xích clinker', N'Khu vực lò nung clinker', '2026-06-05 14:00:00', N'Lê Văn Bảy', N'Đầu hộp số bị nóng ran (trên 80 độ C), tiếng rít kim loại phát ra to hơn bình thường.', N'Hết dầu bôi trơn hộp số hoặc dầu bị lẫn tạp chất, mạt kim loại.', '', '', N'Xả hết dầu cũ, súc rửa sạch hộp số, thay mới 2 thùng dầu Shell Omala S2 G220.', '2026-06-06', N'Nguyễn Văn Hùng', N'Đóng phiếu', N'Đã hoàn thành xuất sắc, nhiệt độ hộp số đã hạ xuống 45 độ C, tiếng máy êm.', N'Dầu hộp số cũ thu hồi vào phuy chứa dầu thải tái chế.', '2026-06-05', N'Trần Minh Đức', '2026-06-06', 4.00, 4800000.00);
GO

-- 5. Seed WorkOrderParts
INSERT INTO [dbo].[WorkOrderParts] ([WorkOrderId], [PartCode], [PartName], [Quantity])
VALUES 
('WO-260601', 'PART-C05', N'Dây curoa răng truyền động bản rộng Gates 8M-1200', 2),
('WO-260602', 'PART-S04', N'Cảm biến tiệm cận Autonics PR12-4DN', 1),
('WO-260603', 'PART-G03', N'Dầu hộp số công nghiệp Shell Omala S2 G220', 2);
GO

-- 6. Seed MaterialRequests
INSERT INTO [dbo].[MaterialRequests] ([Id], [Code], [Date], [Proposer], [WorkOrderId], [DeviceId], [DeviceName], [Reason], [Status], [ApprovedBy], [ApprovalDate], [ProcurementNotes], [DeliveryDate], [ReceptionDate], [Cost])
VALUES 
('MR-260601', 'MR-260601', '2026-06-25', N'Nguyễn Văn Hùng', 'WO-260601', 'DEV-004', N'Gầu tải liệu đá vôi nâng đứng', N'Gầu tải DEV-004 bị đứt curoa xích cấp liệu làm ngừng trệ sản xuất, số lượng tồn kho thực tế chỉ còn 2 sợi (mức an toàn tối thiểu là 10). Cần mua gấp 15 sợi để sửa chữa và khôi phục tồn kho.', N'Đang mua hàng', N'Trần Minh Đức (Trưởng ca)', '2026-06-25', N'Đang trình ký Sếp mua hàng từ nhà phân phối Gates Việt Nam. Đã lên đơn đặt hàng PO-8891.', '2026-07-02', NULL, 12750000.00);
GO

-- 7. Seed MaterialRequestItems
INSERT INTO [dbo].[MaterialRequestItems] ([MaterialRequestId], [PartCode], [PartName], [Quantity], [Unit], [Reason])
VALUES 
('MR-260601', 'PART-C05', N'Dây curoa răng truyền động bản rộng Gates 8M-1200', 15, N'Sợi', N'Mua dự phòng thay thế khẩn cấp và bù đắp tồn kho tối thiểu.');
GO

-- 8. Seed AuditLogs
INSERT INTO [dbo].[AuditLogs] ([Time], [User], [Action], [Details])
VALUES 
('2026-06-29 10:00:00', N'Nguyễn Văn Hùng', N'Đăng nhập hệ thống', N'Đăng nhập thành công với vai trò Kỹ thuật bảo trì (Cơ điện)'),
('2026-06-29 11:15:00', N'Trần Minh Đức', N'Duyệt phiếu sửa chữa', N'Duyệt phiếu sửa chữa WO-260602 cho thiết bị DEV-001'),
('2026-06-29 14:30:00', N'Lê Thị Lan', N'Cập nhật đơn đặt hàng', N'Cập nhật trạng thái phiếu mua vật tư MR-260601 sang ''Đang mua hàng'''),
('2026-06-29 16:00:00', N'Phạm Việt Hoàng', N'Xem báo cáo', N'Xem báo cáo KPI và chi phí bảo trì quý 2');
GO

PRINT '=======================================================';
PRINT 'SADICO CMMS DATABASE (SADICO_P1) CREATED SUCCESSFULLY';
PRINT '=======================================================';
GO
