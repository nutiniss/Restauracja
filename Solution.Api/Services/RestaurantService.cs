using System.Text;
using Microsoft.EntityFrameworkCore;
using Solution.Api.Contracts;
using Solution.Api.Data;
using Solution.Api.Models;

namespace Solution.Api.Services;

public sealed class RestaurantService(RestaurantDbContext db)
{
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
        var order = new Order { TableId = table.Id, WaiterId = waiterId, OpenedAt = "teraz", Status = OrderStatus.Open };
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
        var payment = new Payment { OrderId = orderId, PaymentMethodId = request.PaymentMethodId, Amount = amount, TipAmount = request.TipAmount, PaidAt = "teraz" };
        db.Payments.Add(payment); await db.SaveChangesAsync();
        foreach (var item in items) { item.PaymentId = payment.Id; item.Status = OrderItemStatus.Paid; }
        var paidIds = items.Select(x => x.Id).ToHashSet();
        var hasUnpaid = await db.OrderItems.AnyAsync(x => x.OrderId == orderId && !paidIds.Contains(x.Id) && !x.PaymentId.HasValue && x.Status != OrderItemStatus.Paid && x.Status != OrderItemStatus.Cancelled);
        order.Status = hasUnpaid ? OrderStatus.PartiallyPaid : OrderStatus.Paid; order.ClosedAt = hasUnpaid ? null : "teraz";
        if (await db.Tables.FirstAsync(x => x.Id == order.TableId) is { } table) table.Status = hasUnpaid ? TableStatus.PartiallyPaid : TableStatus.Paid;
        await db.SaveChangesAsync();
    }

    public async Task ReleaseTableAsync(int tableId)
    {
        var table = await db.Tables.FindAsync(tableId) ?? throw new InvalidOperationException("Nie znaleziono stolika.");
        table.Status = TableStatus.Free; table.WaiterId = null; table.OrderId = null; await db.SaveChangesAsync();
    }
    public async Task<byte[]> CreateInvoicePdfAsync(int paymentId)
    {
        var payment = await db.Payments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == paymentId) ?? throw new InvalidOperationException("Nie znaleziono płatności.");
        var order = await db.Orders.AsNoTracking().FirstAsync(x => x.Id == payment.OrderId);
        var table = await db.Tables.AsNoTracking().FirstAsync(x => x.Id == order.TableId);
        var method = await db.PaymentMethods.AsNoTracking().FirstAsync(x => x.Id == payment.PaymentMethodId);
        var items = await db.OrderItems.AsNoTracking()
            .Where(x => x.PaymentId == payment.Id)
            .Join(db.MenuItems.AsNoTracking(), item => item.MenuItemId, menuItem => menuItem.Id, (item, menuItem) => new { item, menuItem })
            .OrderBy(x => x.item.Id)
            .ToListAsync();

        var lines = new List<string>
        {
            $"Faktura #{payment.Id}",
            "RestauracjaPOS",
            $"Data platnosci: {payment.PaidAt}",
            $"Stolik: {table.Number} ({table.Zone})",
            $"Metoda platnosci: {method.Name}",
            "",
            "Pozycje:"
        };

        foreach (var row in items)
        {
            lines.Add($"- {row.menuItem.Name} x{row.item.Quantity}  {row.item.Total:0.00} zl");
        }

        lines.Add("");
        lines.Add($"Suma netto/brutto: {payment.Amount:0.00} zl");
        lines.Add($"Napiwek: {payment.TipAmount:0.00} zl");
        lines.Add($"Razem: {(payment.Amount + payment.TipAmount):0.00} zl");

        return CreateSimplePdf(lines);
    }

    private static byte[] CreateSimplePdf(IReadOnlyList<string> lines)
    {
        static string PdfText(string value) => value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("(", "\\(", StringComparison.Ordinal)
            .Replace(")", "\\)", StringComparison.Ordinal);

        var content = new StringBuilder();
        content.AppendLine("BT");
        content.AppendLine("/F1 14 Tf");
        content.AppendLine("50 790 Td");

        foreach (var line in lines)
        {
            content.AppendLine($"({PdfText(line)}) Tj");
            content.AppendLine("0 -22 Td");
        }

        content.AppendLine("ET");
        var stream = content.ToString();
        var objects = new List<string>
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            $"<< /Length {Encoding.UTF8.GetByteCount(stream)} >>\nstream\n{stream}endstream"
        };

        using var memory = new MemoryStream();
        void Write(string value) => memory.Write(Encoding.UTF8.GetBytes(value));
        Write("%PDF-1.4\n");
        var offsets = new List<long> { 0 };
        for (var i = 0; i < objects.Count; i++)
        {
            offsets.Add(memory.Position);
            Write($"{i + 1} 0 obj\n{objects[i]}\nendobj\n");
        }

        var xrefPosition = memory.Position;
        Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
        {
            Write($"{offset:0000000000} 00000 n \n");
        }

        Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefPosition}\n%%EOF");
        return memory.ToArray();
    }
}
