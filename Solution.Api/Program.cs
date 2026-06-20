using System.Globalization;
using System.Net;
using System.Text;
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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.DocumentTitle = "Restaurant API - Swagger";
    options.RoutePrefix = "swagger";
});

app.MapGet("/", () => Results.Ok(new
{
    name = "Restaurant API",
    status = "running",
    links = new
    {
        swagger = "/swagger",
        database = "/db-view",
        store = "/api/restaurant/store"
    }
}));
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapGet("/db-view", async (RestaurantDbContext db) => Results.Content(await BuildDatabaseViewAsync(db), "text/html; charset=utf-8"));

using (var scope = app.Services.CreateScope())
{
    await RestaurantSeeder.SeedAsync(scope.ServiceProvider.GetRequiredService<RestaurantDbContext>());
}

var api = app.MapGroup("/api/restaurant").WithTags("Restaurant");
api.MapGet("/store", async (RestaurantService service) => await service.GetStoreAsync());
api.MapPost("/tables/{tableId:int}/orders/open", async (int tableId, RestaurantService service) => { await service.OpenOrderAsync(tableId); return Results.Ok(await service.GetStoreAsync()); });
api.MapPost("/tables/{tableId:int}/items", async (int tableId, AddOrderItemRequest request, RestaurantService service) => { await service.AddItemAsync(tableId, request); return Results.Ok(await service.GetStoreAsync()); });
api.MapPut("/tables/{tableId:int}/waiter", async (int tableId, AssignWaiterRequest request, RestaurantService service) => { await service.AssignWaiterAsync(tableId, request); return Results.Ok(await service.GetStoreAsync()); });
api.MapPost("/orders/{orderId:int}/payments", async (int orderId, PayOrderRequest request, RestaurantService service) => { await service.PayAsync(orderId, request); return Results.Ok(await service.GetStoreAsync()); });
api.MapPost("/tables/{tableId:int}/release", async (int tableId, RestaurantService service) => { await service.ReleaseTableAsync(tableId); return Results.Ok(await service.GetStoreAsync()); });

app.Run();

static async Task<string> BuildDatabaseViewAsync(RestaurantDbContext db)
{
    var waiters = await db.Waiters.AsNoTracking().OrderBy(x => x.Id).ToListAsync();
    var categories = await db.Categories.AsNoTracking().OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id).ToListAsync();
    var menuItems = await db.MenuItems.AsNoTracking().Include(x => x.Category).OrderBy(x => x.CategoryId).ThenBy(x => x.Id).ToListAsync();
    var paymentMethods = await db.PaymentMethods.AsNoTracking().OrderBy(x => x.Id).ToListAsync();
    var tables = await db.Tables.AsNoTracking().Include(x => x.Waiter).OrderBy(x => x.Number).ToListAsync();
    var orders = await db.Orders.AsNoTracking().Include(x => x.Table).Include(x => x.Waiter).OrderByDescending(x => x.Id).ToListAsync();
    var orderItems = await db.OrderItems.AsNoTracking().Include(x => x.MenuItem).OrderByDescending(x => x.Id).ToListAsync();
    var payments = await db.Payments.AsNoTracking().Include(x => x.PaymentMethod).OrderByDescending(x => x.Id).ToListAsync();

    var sb = new StringBuilder();
    sb.Append("""
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Podgląd bazy restauracji</title>
  <style>
    :root { color-scheme: light; --bg:#f6f2ea; --card:#fffaf2; --ink:#2b2118; --muted:#7b6a58; --brand:#b45309; --line:#eadfce; --ok:#15803d; --warn:#c2410c; }
    * { box-sizing: border-box; } body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: radial-gradient(circle at top left, #fff7ed, var(--bg)); color:var(--ink); }
    header { padding:32px clamp(18px, 4vw, 56px); background:linear-gradient(135deg,#431407,#9a3412); color:white; box-shadow:0 12px 30px #43140733; }
    h1 { margin:0 0 8px; font-size:clamp(28px,4vw,44px); } p { margin:0; color:inherit; opacity:.85; } main { padding:28px clamp(18px, 4vw, 56px) 56px; }
    .links, .stats { display:flex; flex-wrap:wrap; gap:12px; margin-top:18px; } a { color:inherit; } .pill { padding:10px 14px; border-radius:999px; background:#ffffff22; text-decoration:none; font-weight:700; }
    .stat { min-width:150px; flex:1; padding:18px; border:1px solid var(--line); border-radius:22px; background:rgba(255,250,242,.86); box-shadow:0 10px 24px #7c2d1220; }
    .stat strong { display:block; font-size:30px; color:var(--brand); } section { margin-top:26px; padding:20px; border:1px solid var(--line); border-radius:24px; background:rgba(255,250,242,.92); box-shadow:0 10px 26px #7c2d1214; overflow:hidden; }
    h2 { margin:0 0 14px; font-size:22px; } .table-wrap { overflow:auto; border-radius:16px; border:1px solid var(--line); } table { width:100%; border-collapse:collapse; min-width:760px; background:white; }
    th, td { padding:12px 14px; text-align:left; border-bottom:1px solid var(--line); vertical-align:top; } th { position:sticky; top:0; background:#ffedd5; color:#7c2d12; font-size:12px; text-transform:uppercase; letter-spacing:.06em; } tr:last-child td { border-bottom:0; }
    .badge { display:inline-flex; padding:4px 9px; border-radius:999px; background:#fef3c7; color:#92400e; font-weight:700; font-size:12px; } .badge.ok { background:#dcfce7; color:var(--ok); } .badge.warn { background:#ffedd5; color:var(--warn); }
    .muted { color:var(--muted); } footer { margin-top:24px; color:var(--muted); font-size:13px; }
  </style>
</head>
<body>
<header>
  <h1>Podgląd bazy restauracji</h1>
  <p>Ładny, lekki dashboard SQLite generowany bezpośrednio przez API.</p>
  <nav class="links"><a class="pill" href="/swagger">Swagger</a><a class="pill" href="/api/restaurant/store">JSON sklepu</a><a class="pill" href="/health">Health check</a></nav>
</header>
<main>
""");
    sb.Append($$"""
  <div class="stats">
    <div class="stat"><span>Kelnerzy</span><strong>{{waiters.Count}}</strong></div><div class="stat"><span>Stoliki</span><strong>{{tables.Count}}</strong></div><div class="stat"><span>Pozycje menu</span><strong>{{menuItems.Count}}</strong></div><div class="stat"><span>Zamówienia</span><strong>{{orders.Count}}</strong></div><div class="stat"><span>Płatności</span><strong>{{payments.Count}}</strong></div>
  </div>
""");
    AppendTable(sb, "Stoliki", ["ID", "Numer", "Miejsca", "Strefa", "Status", "Kelner", "Zamówienie"], tables.Select(x => new[] { x.Id, x.Number, x.Seats, x.Zone, Badge(x.Status.ToString()), x.Waiter is null ? "—" : $"{x.Waiter.FirstName} {x.Waiter.LastName}", x.OrderId?.ToString(CultureInfo.InvariantCulture) ?? "—" }));
    AppendTable(sb, "Zamówienia", ["ID", "Stolik", "Kelner", "Otwarte", "Status", "Zamknięte", "Notatki"], orders.Select(x => new[] { x.Id, x.Table?.Number.ToString(CultureInfo.InvariantCulture) ?? x.TableId.ToString(CultureInfo.InvariantCulture), x.Waiter is null ? x.WaiterId.ToString(CultureInfo.InvariantCulture) : $"{x.Waiter.FirstName} {x.Waiter.LastName}", x.OpenedAt, Badge(x.Status.ToString()), x.ClosedAt ?? "—", x.Notes ?? "—" }));
    AppendTable(sb, "Pozycje zamówień", ["ID", "Zamówienie", "Danie", "Ilość", "Cena", "Suma", "Status", "Płatność"], orderItems.Select(x => new[] { x.Id, x.OrderId, x.MenuItem?.Name ?? x.MenuItemId.ToString(CultureInfo.InvariantCulture), x.Quantity, Money(x.UnitPrice), Money(x.Total), Badge(x.Status.ToString()), x.PaymentId?.ToString(CultureInfo.InvariantCulture) ?? "—" }));
    AppendTable(sb, "Menu", ["ID", "Kategoria", "Nazwa", "Opis", "Cena", "Dostępne"], menuItems.Select(x => new[] { x.Id, x.Category?.Name ?? x.CategoryId.ToString(CultureInfo.InvariantCulture), x.Name, x.Description, Money(x.Price), Badge(x.IsAvailable ? "Tak" : "Nie") }));
    AppendTable(sb, "Kategorie", ["ID", "Nazwa", "Opis", "Kolejność", "Aktywna"], categories.Select(x => new[] { x.Id, x.Name, x.Description, x.DisplayOrder, Badge(x.IsActive ? "Tak" : "Nie") }));
    AppendTable(sb, "Kelnerzy", ["ID", "Imię", "Nazwisko", "Kod", "Aktywny"], waiters.Select(x => new[] { x.Id, x.FirstName, x.LastName, x.Code, Badge(x.IsActive ? "Tak" : "Nie") }));
    AppendTable(sb, "Płatności", ["ID", "Zamówienie", "Metoda", "Kwota", "Napiwek", "Data", "Status"], payments.Select(x => new[] { x.Id, x.OrderId, x.PaymentMethod?.Name ?? x.PaymentMethodId.ToString(CultureInfo.InvariantCulture), Money(x.Amount), Money(x.TipAmount), x.PaidAt, Badge(x.Status.ToString()) }));
    AppendTable(sb, "Metody płatności", ["ID", "Nazwa", "Aktywna"], paymentMethods.Select(x => new[] { x.Id, x.Name, Badge(x.IsActive ? "Tak" : "Nie") }));
    sb.Append($"<footer>Wygenerowano: {WebUtility.HtmlEncode(DateTimeOffset.UtcNow.ToString("yyyy-MM-dd HH:mm:ss 'UTC'", CultureInfo.InvariantCulture))}</footer></main></body></html>");
    return sb.ToString();
}

static void AppendTable(StringBuilder sb, string title, string[] headers, IEnumerable<object?[]> rows)
{
    sb.Append($"<section><h2>{WebUtility.HtmlEncode(title)}</h2><div class=\"table-wrap\"><table><thead><tr>");
    foreach (var header in headers) sb.Append($"<th>{WebUtility.HtmlEncode(header)}</th>");
    sb.Append("</tr></thead><tbody>");
    foreach (var row in rows)
    {
        sb.Append("<tr>");
        foreach (var cell in row) sb.Append($"<td>{FormatCell(cell)}</td>");
        sb.Append("</tr>");
    }
    sb.Append("</tbody></table></div></section>");
}

static string FormatCell(object? value) => value is HtmlCell html ? html.Value : WebUtility.HtmlEncode(Convert.ToString(value, CultureInfo.InvariantCulture) ?? "—");
static HtmlCell Badge(string value)
{
    var css = value is "Free" or "Paid" or "Completed" or "Served" or "Tak" ? "ok" : value is "Occupied" or "Open" or "Ordered" or "PartiallyPaid" ? "warn" : string.Empty;
    return new HtmlCell($"<span class=\"badge {css}\">{WebUtility.HtmlEncode(value)}</span>");
}
static string Money(decimal value) => value.ToString("C", CultureInfo.GetCultureInfo("pl-PL"));
readonly record struct HtmlCell(string Value);
