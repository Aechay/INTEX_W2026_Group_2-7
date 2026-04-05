using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Mvc;

namespace INTEX_W2026_Group_2_7.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private AppDbContext _context;
    public WeatherForecastController(AppDbContext temp)
    {
        _context = temp;
    }
    
    private static readonly string[] Summaries =
    [
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    ];

    [HttpGet(Name = "GetWeatherForecast")]
    public IEnumerable<WeatherForecast> Get()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)],
                DbConnected = _context != null
            })
            .ToArray();
    }
}