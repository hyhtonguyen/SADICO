using Microsoft.EntityFrameworkCore;
using SadicoCmms.Data;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Handle circular references and serialize enums as strings
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 1. Configure Entity Framework Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    // Fallback for safety if configuration is missing
    connectionString = "Server=192.168.1.157,1435;Database=SADICO_P1;User Id=sa;Password=123456;TrustServerCertificate=True;MultipleActiveResultSets=True";
}

builder.Services.AddDbContext<CmmsDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    }));

// 2. Configure CORS for React/Vite development or production integration
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(); // OpenApi support for .NET 9

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/", () => "SADICO CMMS C# ASP.NET Core 9 Web API is running and ready to connect to MS SQL Server!");

// --- 3. DATABASE SEED / MIGRATION INITIALIZATION ON START ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CmmsDbContext>();
        
        // Ensure Database is Created (or run migrations)
        context.Database.EnsureCreated();
        
        // Ensure Users are seeded
        if (!context.Users.Any())
        {
            context.Users.AddRange(
                new SadicoCmms.Models.User { Id = "u1", Username = "codien1", Name = "Nguyễn Văn Hùng", Role = "Kỹ thuật bảo trì (Cơ điện)", Dept = "Tổ Cơ điện" },
                new SadicoCmms.Models.User { Id = "u2", Username = "vattu1", Name = "Lê Thị Lan", Role = "Bộ phận Vật tư", Dept = "Phòng Vật tư" },
                new SadicoCmms.Models.User { Id = "u3", Username = "truongca1", Name = "Trần Minh Đức", Role = "Trưởng ca", Dept = "Ban Quản lý Sản xuất" },
                new SadicoCmms.Models.User { Id = "u4", Username = "lanhdao1", Name = "Phạm Việt Hoàng", Role = "Ban lãnh đạo", Dept = "Ban Giám đốc" }
            );
        }

        // Ensure Devices are seeded
        if (!context.Devices.Any())
        {
            context.Devices.AddRange(
                new SadicoCmms.Models.Device { Id = "DEV-001", Code = "DEV-001", Name = "Máy đóng bao xi măng Haver & Boecker 8 vòi", Model = "HB-ROTO-8", Serial = "SN-99812-HB", PurchaseDate = new DateTime(2022, 3, 15), Value = 1250000000m, Location = "Khu vực đóng gói xi măng", Department = "Xưởng đóng bao", Status = "Đang hoạt động", LastMaintenance = new DateTime(2026, 5, 10), CycleDays = 60 },
                new SadicoCmms.Models.Device { Id = "DEV-002", Code = "DEV-002", Name = "Hệ thống cấp liệu băng tải xích clinker", Model = "SADICO-CH-1200", Serial = "SN-2021-SAD-55", PurchaseDate = new DateTime(2021, 8, 20), Value = 750000000m, Location = "Khu vực lò nung clinker", Department = "Xưởng clinker", Status = "Đang hoạt động", LastMaintenance = new DateTime(2026, 6, 1), CycleDays = 30 },
                new SadicoCmms.Models.Device { Id = "DEV-003", Code = "DEV-003", Name = "Máy nén khí trục vít Atlas Copco GA75", Model = "GA75-VSD", Serial = "AC-VSD-750912", PurchaseDate = new DateTime(2023, 1, 10), Value = 480000000m, Location = "Trạm khí nén trung tâm", Department = "Tổ Cơ điện hỗ trợ", Status = "Đang bảo trì", LastMaintenance = new DateTime(2026, 4, 20), CycleDays = 90 },
                new SadicoCmms.Models.Device { Id = "DEV-004", Code = "DEV-004", Name = "Gầu tải liệu đá vôi nâng đứng", Model = "GT-LIME-50T", Serial = "GT-LIME-1029", PurchaseDate = new DateTime(2020, 5, 18), Value = 320000000m, Location = "Kho nguyên liệu đá vôi", Department = "Xưởng chuẩn bị liệu", Status = "Hỏng", LastMaintenance = new DateTime(2026, 3, 5), CycleDays = 45 },
                new SadicoCmms.Models.Device { Id = "DEV-005", Code = "DEV-005", Name = "Hệ thống quạt hút lọc bụi lò quay số 1", Model = "EP-DUST-F180", Serial = "SN-EP-F180-22", PurchaseDate = new DateTime(2022, 11, 5), Value = 920000000m, Location = "Hệ thống lọc bụi tĩnh điện lò quay", Department = "Xưởng lò nung", Status = "Sắp đến hạn bảo trì", LastMaintenance = new DateTime(2026, 5, 1), CycleDays = 60 }
            );
        }

        // Ensure Parts are seeded
        if (!context.Parts.Any())
        {
            context.Parts.AddRange(
                new SadicoCmms.Models.Part { Code = "PART-V01", Name = "Van khí nén 5/2 SMC điện từ", Serial = "SMC-SY5120-5D", Category = "Vật tư sửa chữa", Stock = 12, MinStock = 10, LifecycleMonths = 18, Unit = "Cái", Price = 1500000m, Origin = "Nhật Bản", Color = "Xám bạc", DeviceId = "DEV-001" },
                new SadicoCmms.Models.Part { Code = "PART-B02", Name = "Vòng bi SKF Explorer 22212", Serial = "SKF-22212-E", Category = "Vật tư sửa chữa", Stock = 4, MinStock = 8, LifecycleMonths = 24, Unit = "Bộ", Price = 3200000m, Origin = "Thụy Điển", Color = "Thép sáng", DeviceId = "DEV-002" },
                new SadicoCmms.Models.Part { Code = "PART-G03", Name = "Dầu hộp số công nghiệp Shell Omala S2 G220", Serial = "SHELL-OMALA-220", Category = "Vật tư Trung tâm sản xuất", Stock = 15, MinStock = 5, LifecycleMonths = 12, Unit = "Thùng (20L)", Price = 2400000m, Origin = "Singapore", Color = "Vàng hổ phách", DeviceId = "DEV-003" },
                new SadicoCmms.Models.Part { Code = "PART-S04", Name = "Cảm biến tiệm cận Autonics PR12-4DN", Serial = "AUTO-PR12", Category = "Vật tư sửa chữa", Stock = 25, MinStock = 10, LifecycleMonths = 36, Unit = "Cái", Price = 450000m, Origin = "Hàn Quốc", Color = "Đen", DeviceId = "DEV-001" },
                new SadicoCmms.Models.Part { Code = "PART-C05", Name = "Dây curoa răng truyền động bản rộng Gates 8M-1200", Serial = "GATES-8M-1200", Category = "Vật tư Trung tâm sản xuất", Stock = 2, MinStock = 10, LifecycleMonths = 12, Unit = "Sợi", Price = 850000m, Origin = "Mỹ", Color = "Đen tuyền", DeviceId = "DEV-004" }
            );
        }

        // Ensure Audit Logs are seeded
        if (!context.AuditLogs.Any())
        {
            context.AuditLogs.AddRange(
                new SadicoCmms.Models.AuditLog { Time = DateTime.Now.AddHours(-10), User = "Nguyễn Văn Hùng", Action = "Đăng nhập hệ thống", Details = "Đăng nhập thành công với vai trò Kỹ thuật bảo trì (Cơ điện)" },
                new SadicoCmms.Models.AuditLog { Time = DateTime.Now.AddHours(-8), User = "Trần Minh Đức", Action = "Duyệt phiếu sửa chữa", Details = "Duyệt phiếu sửa chữa WO-260602 cho thiết bị DEV-001" },
                new SadicoCmms.Models.AuditLog { Time = DateTime.Now.AddHours(-5), User = "Lê Thị Lan", Action = "Cập nhật đơn đặt hàng", Details = "Cập nhật trạng thái phiếu mua vật tư MR-260601 sang 'Đang mua hàng'" },
                new SadicoCmms.Models.AuditLog { Time = DateTime.Now.AddHours(-1), User = "Phạm Việt Hoàng", Action = "Xem báo cáo", Details = "Xem báo cáo KPI và chi phí bảo trì quý 2" }
            );
        }

        context.SaveChanges();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred during DB migration or seeding: {ex.Message}");
    }
}

app.Run();
