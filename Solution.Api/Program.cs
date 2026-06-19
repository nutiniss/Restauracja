using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Solution.Api.Contracts;
using Solution.Api.Data;
using Solution.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase)));
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));
builder.Services.AddDbContext<RestaurantDbContext>(options => options.UseSqlite(builder.Configuration.GetConnectionString("RestaurantDb") ?? "Data Source=restaurant.db"));
builder.Services.AddScoped<RestaurantService>();

var app = builder.Build();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    await RestaurantSeeder.SeedAsync(scope.ServiceProvider.GetRequiredService<RestaurantDbContext>());
}

var api = app.MapGroup("/api/restaurant");
api.MapGet("/store", async (RestaurantService service) => await service.GetStoreAsync());
api.MapPost("/tables/{tableId:int}/orders/open", async (int tableId, RestaurantService service) => { await service.OpenOrderAsync(tableId); return Results.Ok(await service.GetStoreAsync()); });
api.MapPost("/tables/{tableId:int}/items", async (int tableId, AddOrderItemRequest request, RestaurantService service) => { await service.AddItemAsync(tableId, request); return Results.Ok(await service.GetStoreAsync()); });
api.MapPut("/tables/{tableId:int}/waiter", async (int tableId, AssignWaiterRequest request, RestaurantService service) => { await service.AssignWaiterAsync(tableId, request); return Results.Ok(await service.GetStoreAsync()); });
api.MapPost("/orders/{orderId:int}/payments", async (int orderId, PayOrderRequest request, RestaurantService service) => { await service.PayAsync(orderId, request); return Results.Ok(await service.GetStoreAsync()); });
api.MapPost("/tables/{tableId:int}/release", async (int tableId, RestaurantService service) => { await service.ReleaseTableAsync(tableId); return Results.Ok(await service.GetStoreAsync()); });

app.Run();
