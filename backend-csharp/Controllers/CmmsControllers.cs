using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SadicoCmms.Data;
using SadicoCmms.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SadicoCmms.Controllers
{
    // 1. AUTH & USERS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly CmmsDbContext _context;

        public UsersController(CmmsDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();
            // Fallback seed if DB is empty
            if (!users.Any())
            {
                users = new List<User>
                {
                    new User { Id = "u1", Username = "codien1", Name = "Nguyễn Văn Hùng", Role = "Kỹ thuật bảo trì (Cơ điện)", Dept = "Tổ Cơ điện" },
                    new User { Id = "u2", Username = "vattu1", Name = "Lê Thị Lan", Role = "Bộ phận Vật tư", Dept = "Phòng Vật tư" },
                    new User { Id = "u3", Username = "truongca1", Name = "Trần Minh Đức", Role = "Trưởng ca", Dept = "Ban Quản lý Sản xuất" },
                    new User { Id = "u4", Username = "lanhdao1", Name = "Phạm Việt Hoàng", Role = "Ban lãnh đạo", Dept = "Ban Giám đốc" }
                };
                _context.Users.AddRange(users);
                await _context.SaveChangesAsync();
            }
            return Ok(users);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "Sai tên đăng nhập!" });
            }

            if (req.Password != "sadico123")
            {
                return Unauthorized(new { success = false, message = "Mật khẩu không chính xác!" });
            }

            // Log action
            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user.Name,
                Action = "Đăng nhập",
                Details = $"Người dùng {user.Name} đăng nhập thành công với vai trò {user.Role}"
            });
            await _context.SaveChangesAsync();

            return Ok(new { success = true, user });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // 2. DEVICES CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly CmmsDbContext _context;
        public DevicesController(CmmsDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Device>>> GetDevices()
        {
            return await _context.Devices.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Device>> CreateDevice([FromBody] Device device, [FromQuery] string? user)
        {
            if (string.IsNullOrEmpty(device.Id))
            {
                device.Id = device.Code ?? $"DEV-{Guid.NewGuid().ToString().Substring(0, 4)}";
            }
            _context.Devices.Add(device);
            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? "Hệ thống",
                Action = "Thêm thiết bị",
                Details = $"Thêm mới thiết bị {device.Name} ({device.Code})"
            });
            await _context.SaveChangesAsync();
            return Ok(new { success = true, device });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(string id, [FromBody] Device device, [FromQuery] string? user)
        {
            if (id != device.Id) return BadRequest();
            _context.Entry(device).State = EntityState.Modified;

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? "Hệ thống",
                Action = "Cập nhật thiết bị",
                Details = $"Cập nhật thông tin thiết bị {device.Name} ({id})"
            });

            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!_context.Devices.Any(e => e.Id == id)) return NotFound(); throw; }
            return Ok(new { success = true, device });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(string id, [FromQuery] string? user)
        {
            var device = await _context.Devices.FindAsync(id);
            if (device == null) return NotFound();
            _context.Devices.Remove(device);

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? "Hệ thống",
                Action = "Xóa thiết bị",
                Details = $"Xóa thiết bị {device.Name} ({id})"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }

    // 3. PARTS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class PartsController : ControllerBase
    {
        private readonly CmmsDbContext _context;
        public PartsController(CmmsDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Part>>> GetParts()
        {
            return await _context.Parts.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Part>> CreatePart([FromBody] Part part, [FromQuery] string? user)
        {
            if (await _context.Parts.AnyAsync(p => p.Code == part.Code))
            {
                return BadRequest(new { success = false, message = $"Mã linh kiện {part.Code} đã tồn tại!" });
            }
            _context.Parts.Add(part);
            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? "Hệ thống",
                Action = "Thêm linh kiện",
                Details = $"Thêm mới linh kiện {part.Name} ({part.Code})"
            });
            await _context.SaveChangesAsync();
            return Ok(new { success = true, part });
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportParts([FromBody] ImportRequest req)
        {
            if (req.Parts == null) return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

            int countAdded = 0;
            int countUpdated = 0;

            foreach (var item in req.Parts)
            {
                if (string.IsNullOrEmpty(item.Code) || string.IsNullOrEmpty(item.Name)) continue;
                var existing = await _context.Parts.FindAsync(item.Code);
                if (existing != null)
                {
                    existing.Name = item.Name;
                    existing.Serial = item.Serial ?? existing.Serial;
                    existing.Category = item.Category ?? existing.Category;
                    existing.Stock = item.Stock;
                    existing.MinStock = item.MinStock;
                    existing.LifecycleMonths = item.LifecycleMonths;
                    existing.Unit = item.Unit ?? existing.Unit;
                    existing.Price = item.Price;
                    existing.Origin = item.Origin ?? existing.Origin;
                    existing.Color = item.Color ?? existing.Color;
                    existing.DeviceId = item.DeviceId ?? existing.DeviceId;
                    countUpdated++;
                }
                else
                {
                    _context.Parts.Add(item);
                    countAdded++;
                }
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = req.User ?? "Hệ thống",
                Action = "Import Excel Vật tư",
                Details = $"Import thành công: Thêm mới {countAdded}, Cập nhật {countUpdated} linh kiện."
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, added = countAdded, updated = countUpdated });
        }
    }

    public class ImportRequest
    {
        public List<Part>? Parts { get; set; }
        public string? User { get; set; }
    }

    // 4. WORKORDERS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class WorkOrdersController : ControllerBase
    {
        private readonly CmmsDbContext _context;
        public WorkOrdersController(CmmsDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetWorkOrders()
        {
            var orders = await _context.WorkOrders.ToListAsync();
            var result = new List<object>();

            foreach (var w in orders)
            {
                var partsUsed = await _context.WorkOrderParts
                    .Where(wp => wp.WorkOrderId == w.Id)
                    .Select(wp => new { wp.PartCode, wp.PartName, wp.Quantity })
                    .ToListAsync();

                result.Add(new
                {
                    w.Id,
                    w.Code,
                    w.Date,
                    w.Creator,
                    w.Department,
                    w.DeviceId,
                    w.DeviceName,
                    w.Location,
                    w.FaultTime,
                    w.FaultFinder,
                    w.Symptom,
                    w.Cause,
                    w.ImageBefore,
                    w.ImageAfter,
                    w.ProposedSolution,
                    w.TargetCompletion,
                    w.Technician,
                    w.Status,
                    w.Notes,
                    w.RecoveredMaterials,
                    w.ApprovalDate,
                    w.ApprovedBy,
                    w.CompletedDate,
                    w.DurationHours,
                    w.Cost,
                    partsUsed
                });
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkOrder([FromBody] WorkOrderDto dto, [FromQuery] string? user)
        {
            var wo = new WorkOrder
            {
                Id = dto.Id ?? $"WO-{Guid.NewGuid().ToString().Substring(0, 6)}",
                Code = dto.Code ?? $"WO-{DateTime.Now:yyMMddHHmmss}",
                Date = dto.Date ?? DateTime.Today,
                Creator = dto.Creator,
                Department = dto.Department,
                DeviceId = dto.DeviceId,
                DeviceName = dto.DeviceName,
                Location = dto.Location,
                FaultTime = dto.FaultTime ?? DateTime.Now,
                FaultFinder = dto.FaultFinder,
                Symptom = dto.Symptom,
                Cause = dto.Cause,
                ImageBefore = dto.ImageBefore,
                ImageAfter = dto.ImageAfter,
                ProposedSolution = dto.ProposedSolution,
                TargetCompletion = dto.TargetCompletion,
                Technician = dto.Technician,
                Status = dto.Status ?? "Sẵn sàng thực hiện",
                Notes = dto.Notes,
                RecoveredMaterials = dto.RecoveredMaterials,
                ApprovalDate = dto.ApprovalDate,
                ApprovedBy = dto.ApprovedBy,
                CompletedDate = dto.CompletedDate,
                DurationHours = dto.DurationHours,
                Cost = dto.Cost
            };

            _context.WorkOrders.Add(wo);

            // Add parts if any
            if (dto.PartsUsed != null)
            {
                foreach (var p in dto.PartsUsed)
                {
                    _context.WorkOrderParts.Add(new WorkOrderPart
                    {
                        WorkOrderId = wo.Id,
                        PartCode = p.PartCode,
                        PartName = p.PartName,
                        Quantity = p.Quantity
                    });
                }
            }

            // Update Device Status to maintenance / error if status is relevant
            var device = await _context.Devices.FindAsync(wo.DeviceId);
            if (device != null)
            {
                device.Status = wo.Status == "Hoàn thành" || wo.Status == "Đóng phiếu" ? "Đang hoạt động" : "Đang bảo trì";
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? dto.Creator,
                Action = "Tạo phiếu sửa chữa",
                Details = $"Tạo phiếu sửa chữa {wo.Code} cho thiết bị {wo.DeviceName} ({wo.Status})"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, workOrder = wo });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkOrder(string id, [FromBody] WorkOrderDto dto, [FromQuery] string? user)
        {
            var wo = await _context.WorkOrders.FindAsync(id);
            if (wo == null) return NotFound();

            string oldStatus = wo.Status;

            wo.Creator = dto.Creator;
            wo.Department = dto.Department;
            wo.DeviceId = dto.DeviceId;
            wo.DeviceName = dto.DeviceName;
            wo.Location = dto.Location;
            if (dto.FaultTime.HasValue) wo.FaultTime = dto.FaultTime.Value;
            wo.FaultFinder = dto.FaultFinder;
            wo.Symptom = dto.Symptom;
            wo.Cause = dto.Cause;
            wo.ImageBefore = dto.ImageBefore ?? wo.ImageBefore;
            wo.ImageAfter = dto.ImageAfter ?? wo.ImageAfter;
            wo.ProposedSolution = dto.ProposedSolution;
            wo.TargetCompletion = dto.TargetCompletion;
            wo.Technician = dto.Technician;
            wo.Status = dto.Status ?? wo.Status;
            wo.Notes = dto.Notes;
            wo.RecoveredMaterials = dto.RecoveredMaterials;
            wo.ApprovalDate = dto.ApprovalDate;
            wo.ApprovedBy = dto.ApprovedBy;
            wo.CompletedDate = dto.CompletedDate;
            wo.DurationHours = dto.DurationHours;
            wo.Cost = dto.Cost;

            // Handle Parts update: Delete old and re-add
            var oldParts = await _context.WorkOrderParts.Where(wp => wp.WorkOrderId == id).ToListAsync();
            _context.WorkOrderParts.RemoveRange(oldParts);

            if (dto.PartsUsed != null)
            {
                foreach (var p in dto.PartsUsed)
                {
                    _context.WorkOrderParts.Add(new WorkOrderPart
                    {
                        WorkOrderId = id,
                        PartCode = p.PartCode,
                        PartName = p.PartName,
                        Quantity = p.Quantity
                    });
                }
            }

            // Deduct Inventory Stock on Complete / Close
            bool isNowCompleted = wo.Status == "Hoàn thành" || wo.Status == "Đóng phiếu";
            bool wasAlreadyCompleted = oldStatus == "Hoàn thành" || oldStatus == "Đóng phiếu";

            if (isNowCompleted && !wasAlreadyCompleted && dto.PartsUsed != null)
            {
                foreach (var pu in dto.PartsUsed)
                {
                    var dbPart = await _context.Parts.FindAsync(pu.PartCode);
                    if (dbPart != null)
                    {
                        dbPart.Stock = Math.Max(0, dbPart.Stock - pu.Quantity);
                        _context.AuditLogs.Add(new AuditLog
                        {
                            Time = DateTime.Now,
                            User = "Hệ thống Tự động",
                            Action = "Trừ kho vật tư",
                            Details = $"Xuất kho {dbPart.Name} (-{pu.Quantity} {dbPart.Unit}) phục vụ sửa chữa phiếu {wo.Code}"
                        });
                    }
                }

                // Update device status back to active
                var device = await _context.Devices.FindAsync(wo.DeviceId);
                if (device != null)
                {
                    device.Status = "Đang hoạt động";
                    device.LastMaintenance = DateTime.Today;
                }
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? "Hệ thống",
                Action = "Cập nhật phiếu sửa chữa",
                Details = $"Cập nhật trạng thái phiếu {wo.Code} thành '{wo.Status}'"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, workOrder = wo });
        }
    }

    public class WorkOrderDto
    {
        public string? Id { get; set; }
        public string? Code { get; set; }
        public DateTime? Date { get; set; }
        public string Creator { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime? FaultTime { get; set; }
        public string? FaultFinder { get; set; }
        public string? Symptom { get; set; }
        public string? Cause { get; set; }
        public string? ImageBefore { get; set; }
        public string? ImageAfter { get; set; }
        public string? ProposedSolution { get; set; }
        public DateTime? TargetCompletion { get; set; }
        public string? Technician { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public string? RecoveredMaterials { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal? DurationHours { get; set; }
        public decimal Cost { get; set; } = 0;
        public List<PartUsedDto>? PartsUsed { get; set; }
    }

    public class PartUsedDto
    {
        public string PartCode { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
    }

    // 5. MATERIAL REQUESTS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialRequestsController : ControllerBase
    {
        private readonly CmmsDbContext _context;
        public MaterialRequestsController(CmmsDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetMaterialRequests()
        {
            var requests = await _context.MaterialRequests.ToListAsync();
            var result = new List<object>();

            foreach (var r in requests)
            {
                var items = await _context.MaterialRequestItems
                    .Where(ri => ri.MaterialRequestId == r.Id)
                    .Select(ri => new { ri.PartCode, ri.PartName, ri.Quantity, ri.Unit, ri.Reason })
                    .ToListAsync();

                result.Add(new
                {
                    r.Id,
                    r.Code,
                    r.Date,
                    r.Proposer,
                    r.WorkOrderId,
                    r.DeviceId,
                    r.DeviceName,
                    r.Reason,
                    r.Status,
                    r.ApprovedBy,
                    r.ApprovalDate,
                    r.ProcurementNotes,
                    r.DeliveryDate,
                    r.ReceptionDate,
                    r.Cost,
                    items
                });
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMaterialRequest([FromBody] MaterialRequestDto dto, [FromQuery] string? user)
        {
            var mr = new MaterialRequest
            {
                Id = dto.Id ?? $"MR-{Guid.NewGuid().ToString().Substring(0, 6)}",
                Code = dto.Code ?? $"MR-{DateTime.Now:yyMMddHHmmss}",
                Date = dto.Date ?? DateTime.Today,
                Proposer = dto.Proposer,
                WorkOrderId = dto.WorkOrderId,
                DeviceId = dto.DeviceId,
                DeviceName = dto.DeviceName,
                Reason = dto.Reason,
                Status = dto.Status ?? "Chờ duyệt",
                Cost = dto.Cost
            };

            _context.MaterialRequests.Add(mr);

            if (dto.Items != null)
            {
                foreach (var it in dto.Items)
                {
                    _context.MaterialRequestItems.Add(new MaterialRequestItem
                    {
                        MaterialRequestId = mr.Id,
                        PartCode = it.PartCode,
                        PartName = it.PartName,
                        Quantity = it.Quantity,
                        Unit = it.Unit,
                        Reason = it.Reason
                    });
                }
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? dto.Proposer,
                Action = "Tạo đề xuất vật tư",
                Details = $"Tạo phiếu đề xuất vật tư {mr.Code} trị giá {mr.Cost:N0} VNĐ"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, materialRequest = mr });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaterialRequest(string id, [FromBody] MaterialRequestDto dto, [FromQuery] string? user)
        {
            var mr = await _context.MaterialRequests.FindAsync(id);
            if (mr == null) return NotFound();

            string oldStatus = mr.Status;

            mr.Status = dto.Status ?? mr.Status;
            mr.ApprovedBy = dto.ApprovedBy ?? mr.ApprovedBy;
            mr.ApprovalDate = dto.ApprovalDate ?? mr.ApprovalDate;
            mr.ProcurementNotes = dto.ProcurementNotes ?? mr.ProcurementNotes;
            mr.DeliveryDate = dto.DeliveryDate ?? mr.DeliveryDate;
            mr.ReceptionDate = dto.ReceptionDate ?? mr.ReceptionDate;
            mr.Cost = dto.Cost;

            // Handle items update: Delete old and re-add
            var oldItems = await _context.MaterialRequestItems.Where(ri => ri.MaterialRequestId == id).ToListAsync();
            _context.MaterialRequestItems.RemoveRange(oldItems);

            if (dto.Items != null)
            {
                foreach (var it in dto.Items)
                {
                    _context.MaterialRequestItems.Add(new MaterialRequestItem
                    {
                        MaterialRequestId = id,
                        PartCode = it.PartCode,
                        PartName = it.PartName,
                        Quantity = it.Quantity,
                        Unit = it.Unit,
                        Reason = it.Reason
                    });
                }
            }

            // If transitions to Received, add stock to parts catalog
            bool isNowReceived = mr.Status == "Đã giao hàng/Nhập kho";
            bool wasAlreadyReceived = oldStatus == "Đã giao hàng/Nhập kho";

            if (isNowReceived && !wasAlreadyReceived && dto.Items != null)
            {
                foreach (var it in dto.Items)
                {
                    var dbPart = await _context.Parts.FindAsync(it.PartCode);
                    if (dbPart != null)
                    {
                        dbPart.Stock += it.Quantity;
                    }
                    else
                    {
                        // Create a new part catalog if not exists
                        _context.Parts.Add(new Part
                        {
                            Code = it.PartCode,
                            Name = it.PartName,
                            Stock = it.Quantity,
                            Unit = it.Unit ?? "Cái",
                            Category = "Vật tư sửa chữa",
                            Price = 0
                        });
                    }

                    _context.AuditLogs.Add(new AuditLog
                    {
                        Time = DateTime.Now,
                        User = "Hệ thống Tự động",
                        Action = "Nhập kho vật tư",
                        Details = $"Nhập kho bổ sung {it.PartName} (+{it.Quantity} {it.Unit}) theo đề xuất {mr.Code}"
                    });
                }
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Time = DateTime.Now,
                User = user ?? "Hệ thống",
                Action = "Cập nhật đề xuất vật tư",
                Details = $"Cập nhật phiếu mua vật tư {mr.Code} sang '{mr.Status}'"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, materialRequest = mr });
        }
    }

    public class MaterialRequestDto
    {
        public string? Id { get; set; }
        public string? Code { get; set; }
        public DateTime? Date { get; set; }
        public string Proposer { get; set; } = string.Empty;
        public string? WorkOrderId { get; set; }
        public string? DeviceId { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public string? Status { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string? ProcurementNotes { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public DateTime? ReceptionDate { get; set; }
        public decimal Cost { get; set; } = 0;
        public List<MaterialRequestItemDto>? Items { get; set; }
    }

    public class MaterialRequestItemDto
    {
        public string PartCode { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public string? Unit { get; set; }
        public string? Reason { get; set; }
    }

    // 6. SYSTEM AUDIT & METRICS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class SystemController : ControllerBase
    {
        private readonly CmmsDbContext _context;
        public SystemController(CmmsDbContext context) { _context = context; }

        [HttpGet("audit-logs")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogs()
        {
            return await _context.AuditLogs.OrderByDescending(l => l.Time).Take(200).ToListAsync();
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalDevices = await _context.Devices.CountAsync();
            var activeDevices = await _context.Devices.CountAsync(d => d.Status == "Đang hoạt động");
            var errorDevices = await _context.Devices.CountAsync(d => d.Status == "Hỏng" || d.Status == "Đang bảo trì");

            var totalOrders = await _context.WorkOrders.CountAsync();
            var openOrders = await _context.WorkOrders.CountAsync(w => w.Status != "Hoàn thành" && w.Status != "Đóng phiếu");
            var completedOrders = await _context.WorkOrders.CountAsync(w => w.Status == "Hoàn thành" || w.Status == "Đóng phiếu");

            var pendingRequests = await _context.MaterialRequests.CountAsync(m => m.Status == "Chờ duyệt");
            var approvedCost = await _context.MaterialRequests
                .Where(m => m.Status != "Bị từ chối")
                .SumAsync(m => m.Cost);

            var totalMaintenanceCost = await _context.WorkOrders.SumAsync(w => w.Cost);

            // Fetch monthly costs (grouping by Month)
            var monthlyCosts = await _context.WorkOrders
                .Where(w => w.CompletedDate.HasValue)
                .GroupBy(w => w.CompletedDate!.Value.Month)
                .Select(g => new { Month = "T" + g.Key, Cost = g.Sum(w => w.Cost) })
                .ToListAsync();

            // Fetch device distribution by Status
            var deviceStatusDist = await _context.Devices
                .GroupBy(d => d.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            // Recent work orders
            var recentWOs = await _context.WorkOrders
                .OrderByDescending(w => w.Date)
                .Take(5)
                .Select(w => new { w.Code, w.DeviceName, w.Status, w.Cost })
                .ToListAsync();

            return Ok(new
            {
                totalDevices,
                activeDevices,
                errorDevices,
                totalOrders,
                openOrders,
                completedOrders,
                pendingRequests,
                totalMaintenanceCost = totalMaintenanceCost + approvedCost,
                monthlyCosts = monthlyCosts.Any() ? monthlyCosts : new[] { new { Month = "T6", Cost = (double)totalMaintenanceCost } },
                deviceStatusDist,
                recentWOs
            });
        }
    }
}
