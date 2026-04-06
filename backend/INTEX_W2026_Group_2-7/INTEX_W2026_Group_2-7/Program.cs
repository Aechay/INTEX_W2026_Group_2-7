using INTEX_W2026_Group_2_7.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseCors(options =>
{
    options.WithOrigins("https://wintex.alijahwhitney.dev", "https://wonderful-ocean-0a5af5610.2.azurestaticapps.net/")
        .AllowAnyMethod()
        .AllowAnyHeader();
});


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors(options =>
    {
        options.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
    app.UseSwagger(); // Generates the JSON file (e.g., /swagger/v1/swagger.json)
    app.UseSwaggerUI(); // Enables the interactive web UI (e.g., /swagger)
}


app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();