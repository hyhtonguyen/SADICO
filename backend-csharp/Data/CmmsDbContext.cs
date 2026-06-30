using Microsoft.EntityFrameworkCore;
using SadicoCmms.Models;

namespace SadicoCmms.Data
{
    public class CmmsDbContext : DbContext
    {
        public CmmsDbContext(DbContextOptions<CmmsDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
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
            
            // Set scale and precision for decimal properties if needed
            modelBuilder.Entity<Device>().Property(d => d.Value).HasPrecision(18, 2);
            modelBuilder.Entity<Part>().Property(p => p.Price).HasPrecision(18, 2);
            modelBuilder.Entity<WorkOrder>().Property(w => w.Cost).HasPrecision(18, 2);
            modelBuilder.Entity<WorkOrder>().Property(w => w.DurationHours).HasPrecision(5, 2);
            modelBuilder.Entity<MaterialRequest>().Property(m => m.Cost).HasPrecision(18, 2);
        }
    }
}
