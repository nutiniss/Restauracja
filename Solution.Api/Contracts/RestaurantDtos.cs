using Solution.Api.Models;

namespace Solution.Api.Contracts;

public sealed record RestaurantStoreDto(IReadOnlyList<RestaurantTable> Tables, IReadOnlyList<Waiter> Waiters, IReadOnlyList<MenuCategory> Categories, IReadOnlyList<MenuItem> MenuItems, IReadOnlyList<Order> Orders, IReadOnlyList<OrderItem> OrderItems, IReadOnlyList<Payment> Payments, IReadOnlyList<PaymentMethod> PaymentMethods);
public sealed record AddOrderItemRequest(int MenuItemId, int Quantity, string? Notes);
public sealed record AssignWaiterRequest(int WaiterId);
public sealed record PayOrderRequest(int PaymentMethodId, IReadOnlyList<int>? OrderItemIds, decimal TipAmount = 0);
