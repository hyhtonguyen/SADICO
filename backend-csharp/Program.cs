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

// --- 3. DATABASE INITIALIZATION ONLY (no mock/seed data) ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CmmsDbContext>();

        // Create tables if needed, but do not seed fake data.
        context.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred during DB initialization: {ex.Message}");
    }
}

app.Run();
