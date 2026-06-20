using Microsoft.EntityFrameworkCore;
using Solution.Api.Models;

namespace Solution.Api.Data;

public static class RestaurantSeeder
{
    public static async Task SeedAsync(RestaurantDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        await EnsureSchemaAsync(db);
        if (db.Waiters.Any()) return;

        await using var transaction = await db.Database.BeginTransactionAsync();

        db.Waiters.AddRange(new Waiter { Id = 1, FirstName = "Anna", LastName = "Nowak", Code = "AN01" }, new Waiter { Id = 2, FirstName = "Marek", LastName = "Kowalski", Code = "MK02" }, new Waiter { Id = 3, FirstName = "Julia", LastName = "Lis", Code = "JL03" });
        db.Categories.AddRange(new MenuCategory { Id = 1, Name = "Pizza", Description = "Wypiekana w piecu", DisplayOrder = 1 }, new MenuCategory { Id = 2, Name = "Napoje", Description = "Zimne i gorące", DisplayOrder = 2 }, new MenuCategory { Id = 3, Name = "Desery", Description = "Słodkie zakończenie", DisplayOrder = 3 });
        db.PaymentMethods.AddRange(new PaymentMethod { Id = 1, Name = "Karta" }, new PaymentMethod { Id = 2, Name = "Gotówka" }, new PaymentMethod { Id = 3, Name = "BLIK" });
        await db.SaveChangesAsync();

        db.MenuItems.AddRange(new MenuItem { Id = 1, CategoryId = 1, Name = "Margherita", Description = "Sos pomidorowy, mozzarella, bazylia", Price = 32 }, new MenuItem { Id = 2, CategoryId = 1, Name = "Capricciosa", Description = "Szynka, pieczarki, mozzarella", Price = 39 }, new MenuItem { Id = 3, CategoryId = 1, Name = "Diavola", Description = "Pikantne salami, chilli", Price = 42 }, new MenuItem { Id = 4, CategoryId = 2, Name = "Lemoniada", Description = "Cytryna, mięta, lód", Price = 14 }, new MenuItem { Id = 5, CategoryId = 2, Name = "Espresso", Description = "Podwójny shot", Price = 10 }, new MenuItem { Id = 6, CategoryId = 3, Name = "Tiramisu", Description = "Mascarpone, kawa, kakao", Price = 22 });
        db.Tables.AddRange(new RestaurantTable { Id = 1, Number = 1, Seats = 2, Zone = "Sala" }, new RestaurantTable { Id = 2, Number = 2, Seats = 4, Zone = "Sala", Status = TableStatus.Occupied, WaiterId = 1, OrderId = 1 }, new RestaurantTable { Id = 3, Number = 3, Seats = 4, Zone = "Ogródek", Status = TableStatus.PartiallyPaid, WaiterId = 2, OrderId = 2 }, new RestaurantTable { Id = 4, Number = 4, Seats = 6, Zone = "Sala" }, new RestaurantTable { Id = 5, Number = 5, Seats = 2, Zone = "Taras", Status = TableStatus.Paid, WaiterId = 3, OrderId = 3 }, new RestaurantTable { Id = 6, Number = 6, Seats = 8, Zone = "Sala" });
        await db.SaveChangesAsync();

        db.Orders.AddRange(new Order { Id = 1, TableId = 2, WaiterId = 1, OpenedAt = "2026-06-20 12:30", Status = OrderStatus.Open }, new Order { Id = 2, TableId = 3, WaiterId = 2, OpenedAt = "2026-06-20 13:05", Status = OrderStatus.PartiallyPaid }, new Order { Id = 3, TableId = 5, WaiterId = 3, OpenedAt = "2026-06-20 11:40", Status = OrderStatus.Paid, ClosedAt = "2026-06-20 12:25" });
        await db.SaveChangesAsync();

        db.Payments.AddRange(new Payment { Id = 1, OrderId = 2, PaymentMethodId = 1, Amount = 39, TipAmount = 0, PaidAt = "2026-06-20 13:30" }, new Payment { Id = 2, OrderId = 3, PaymentMethodId = 2, Amount = 20, TipAmount = 5, PaidAt = "2026-06-20 12:25" });
        await db.SaveChangesAsync();

        db.OrderItems.AddRange(new OrderItem { Id = 1, OrderId = 1, MenuItemId = 1, Quantity = 1, UnitPrice = 32, Status = OrderItemStatus.Served }, new OrderItem { Id = 2, OrderId = 1, MenuItemId = 4, Quantity = 2, UnitPrice = 14, Status = OrderItemStatus.Served }, new OrderItem { Id = 3, OrderId = 2, MenuItemId = 2, Quantity = 1, UnitPrice = 39, Status = OrderItemStatus.Paid, PaymentId = 1 }, new OrderItem { Id = 4, OrderId = 2, MenuItemId = 6, Quantity = 1, UnitPrice = 22, Status = OrderItemStatus.Served }, new OrderItem { Id = 5, OrderId = 3, MenuItemId = 5, Quantity = 2, UnitPrice = 10, Status = OrderItemStatus.Paid, PaymentId = 2 });
        await db.SaveChangesAsync();

        await transaction.CommitAsync();
    }

    private static async Task EnsureSchemaAsync(RestaurantDbContext db)
    {
        var tableColumns = await db.Database.SqlQueryRaw<string>("SELECT name AS Value FROM pragma_table_info('Tables')").ToListAsync();
        if (!tableColumns.Contains(nameof(RestaurantTable.IsActive)))
        {
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Tables ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1");
        }
    }
}
