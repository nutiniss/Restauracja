using Microsoft.EntityFrameworkCore;
using Solution.Api.Contracts;
using Solution.Api.Data;
using Solution.Api.Models;

namespace Solution.Api.Services;

public sealed class RestaurantService(RestaurantDbContext db)
{
    private static string CurrentTimestamp() => DateTime.Now.ToString("yyyy-MM-dd HH:mm");
    public async Task<RestaurantStoreDto> GetStoreAsync() => new(
        await db.Tables.AsNoTracking().OrderBy(x => x.Number).ToListAsync(), await db.Waiters.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        await db.Categories.AsNoTracking().OrderBy(x => x.DisplayOrder).ToListAsync(), await db.MenuItems.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        await db.Orders.AsNoTracking().OrderBy(x => x.Id).ToListAsync(), await db.OrderItems.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        await db.Payments.AsNoTracking().OrderByDescending(x => x.Id).ToListAsync(), await db.PaymentMethods.AsNoTracking().OrderBy(x => x.Id).ToListAsync());

    public async Task OpenOrderAsync(int tableId)
    {
        var table = await db.Tables.FindAsync(tableId) ?? throw new InvalidOperationException("Nie znaleziono stolika.");
        if (table.OrderId.HasValue) return;
        var waiterId = table.WaiterId ?? await db.Waiters.Where(x => x.IsActive).Select(x => x.Id).FirstAsync();
        var order = new Order { TableId = table.Id, WaiterId = waiterId, OpenedAt = CurrentTimestamp(), Status = OrderStatus.Open };
        db.Orders.Add(order); await db.SaveChangesAsync();
        table.OrderId = order.Id; table.WaiterId = waiterId; table.Status = TableStatus.Occupied; await db.SaveChangesAsync();
    }

    public async Task AddItemAsync(int tableId, AddOrderItemRequest request)
    {
        if (request.Quantity <= 0) throw new InvalidOperationException("Ilość musi być większa od zera.");
        var table = await db.Tables.FindAsync(tableId) ?? throw new InvalidOperationException("Nie znaleziono stolika.");
        var menuItem = await db.MenuItems.FindAsync(request.MenuItemId) ?? throw new InvalidOperationException("Nie znaleziono pozycji menu.");
        if (!menuItem.IsAvailable) throw new InvalidOperationException("Pozycja menu jest niedostępna.");
        if (!table.OrderId.HasValue) await OpenOrderAsync(tableId);
        await db.Entry(table).ReloadAsync();
        db.OrderItems.Add(new OrderItem { OrderId = table.OrderId!.Value, MenuItemId = menuItem.Id, Quantity = request.Quantity, UnitPrice = menuItem.Price, Status = OrderItemStatus.Ordered, Notes = request.Notes });
        await db.SaveChangesAsync();
    }

    public async Task AssignWaiterAsync(int tableId, AssignWaiterRequest request)
    {
        var waiter = await db.Waiters.FindAsync(request.WaiterId) ?? throw new InvalidOperationException("Nie znaleziono kelnera.");
        if (!waiter.IsActive) throw new InvalidOperationException("Kelner jest nieaktywny.");
        var table = await db.Tables.FindAsync(tableId) ?? throw new InvalidOperationException("Nie znaleziono stolika.");
        table.WaiterId = waiter.Id;
        if (table.OrderId.HasValue && await db.Orders.FindAsync(table.OrderId.Value) is { } order) order.WaiterId = waiter.Id;
        await db.SaveChangesAsync();
    }

    public async Task PayAsync(int orderId, PayOrderRequest request)
    {
        var order = await db.Orders.FindAsync(orderId) ?? throw new InvalidOperationException("Nie znaleziono zamówienia.");
        var ids = request.OrderItemIds?.Count > 0 ? request.OrderItemIds : null;
        var items = await db.OrderItems.Where(x => x.OrderId == orderId && !x.PaymentId.HasValue && x.Status != OrderItemStatus.Paid && x.Status != OrderItemStatus.Cancelled && (ids == null || ids.Contains(x.Id))).ToListAsync();
        var amount = items.Sum(x => x.Total); if (amount <= 0) return;
        var payment = new Payment { OrderId = orderId, PaymentMethodId = request.PaymentMethodId, Amount = amount, TipAmount = request.TipAmount, PaidAt = CurrentTimestamp() };
        db.Payments.Add(payment); await db.SaveChangesAsync();
        foreach (var item in items) { item.PaymentId = payment.Id; item.Status = OrderItemStatus.Paid; }
        var paidIds = items.Select(x => x.Id).ToHashSet();
        var hasUnpaid = await db.OrderItems.AnyAsync(x => x.OrderId == orderId && !paidIds.Contains(x.Id) && !x.PaymentId.HasValue && x.Status != OrderItemStatus.Paid && x.Status != OrderItemStatus.Cancelled);
        order.Status = hasUnpaid ? OrderStatus.PartiallyPaid : OrderStatus.Paid; order.ClosedAt = hasUnpaid ? null : CurrentTimestamp();
        if (await db.Tables.FirstAsync(x => x.Id == order.TableId) is { } table) table.Status = hasUnpaid ? TableStatus.PartiallyPaid : TableStatus.Paid;
        await db.SaveChangesAsync();
    }

    public async Task ReleaseTableAsync(int tableId)
    {
        var table = await db.Tables.FindAsync(tableId) ?? throw new InvalidOperationException("Nie znaleziono stolika.");
        table.Status = TableStatus.Free; table.WaiterId = null; table.OrderId = null; await db.SaveChangesAsync();
    }
}
