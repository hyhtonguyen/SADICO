using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SadicoCmms.Models
{
    [Table("Roles")]
    public class Role
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool CanManageDevices { get; set; } = false;
        public bool CanManageWorkOrders { get; set; } = false;
        public bool CanManageParts { get; set; } = false;
        public bool CanManageMaterials { get; set; } = false;
        public bool CanManageUsers { get; set; } = false;
        public bool CanViewAuditLogs { get; set; } = true;
    }

    [Table("Users")]
    public class User
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = "123456";
        public string Name { get; set; } = string.Empty;
        public string RoleId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Dept { get; set; } = string.Empty;

        [ForeignKey("RoleId")]
        public Role? RoleDetails { get; set; }
    }

    [Table("Devices")]
    public class Device
    {
        [Key]
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

    [Table("Parts")]
    public class Part
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Serial { get; set; }
        public string Category { get; set; } = "Vật tư sửa chữa";
        public int Stock { get; set; } = 0;
        public int MinStock { get; set; } = 10;
        public int LifecycleMonths { get; set; } = 12;
        public string Unit { get; set; } = "Cái";
        public decimal Price { get; set; } = 0;
        public string? Origin { get; set; }
        public string? Color { get; set; }
        public string? DeviceId { get; set; }
    }

    [Table("WorkOrders")]
    public class WorkOrder
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.Today;
        public string Creator { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime FaultTime { get; set; } = DateTime.Now;
        public string? FaultFinder { get; set; }
        public string? Symptom { get; set; }
        public string? Cause { get; set; }
        public string? ImageBefore { get; set; }
        public string? ImageAfter { get; set; }
        public string? ProposedSolution { get; set; }
        public DateTime? TargetCompletion { get; set; }
        public string? Technician { get; set; }
        public string Status { get; set; } = "Sẵn sàng thực hiện";
        public string? Notes { get; set; }
        public string? RecoveredMaterials { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal? DurationHours { get; set; }
        public decimal Cost { get; set; } = 0;
    }

    [Table("WorkOrderParts")]
    public class WorkOrderPart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string WorkOrderId { get; set; } = string.Empty;
        public string PartCode { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
    }

    [Table("MaterialRequests")]
    public class MaterialRequest
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.Today;
        public string Proposer { get; set; } = string.Empty;
        public string? WorkOrderId { get; set; }
        public string? DeviceId { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public string Status { get; set; } = "Chờ duyệt";
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string? ProcurementNotes { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public DateTime? ReceptionDate { get; set; }
        public decimal Cost { get; set; } = 0;
    }

    [Table("MaterialRequestItems")]
    public class MaterialRequestItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string MaterialRequestId { get; set; } = string.Empty;
        public string PartCode { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public string? Unit { get; set; }
        public string? Reason { get; set; }
    }

    [Table("AuditLogs")]
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public DateTime Time { get; set; } = DateTime.Now;
        public string User { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Details { get; set; }
    }
}
