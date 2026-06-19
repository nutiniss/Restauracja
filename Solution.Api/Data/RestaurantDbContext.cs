using Microsoft.EntityFrameworkCore;
using Solution.Api.Models;

namespace Solution.Api.Data;

public sealed class RestaurantDbContext(DbContextOptions<RestaurantDbContext> options) : DbContext(options)
{
    public DbSet<Waiter> Waiters => Set<Waiter>();
    public DbSet<MenuCategory> Categories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<RestaurantTable> Tables => Set<RestaurantTable>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MenuItem>().Property(x => x.Price).HasConversion<double>();
        modelBuilder.Entity<OrderItem>().Property(x => x.UnitPrice).HasConversion<double>();
        modelBuilder.Entity<Payment>().Property(x => x.Amount).HasConversion<double>();
        modelBuilder.Entity<Payment>().Property(x => x.TipAmount).HasConversion<double>();
        modelBuilder.Entity<RestaurantTable>().HasOne(x => x.Waiter).WithMany().HasForeignKey(x => x.WaiterId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Order>().HasOne(x => x.Table).WithMany().HasForeignKey(x => x.TableId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Order>().HasOne(x => x.Waiter).WithMany().HasForeignKey(x => x.WaiterId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<OrderItem>().HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<OrderItem>().HasOne(x => x.MenuItem).WithMany().HasForeignKey(x => x.MenuItemId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Payment>().HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Payment>().HasOne(x => x.PaymentMethod).WithMany().HasForeignKey(x => x.PaymentMethodId).OnDelete(DeleteBehavior.Restrict);
    }
}
