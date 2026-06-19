import {OrderItemStatus} from '../enums/RestaurantEnums';

export class OrderItem {
  constructor(
    public readonly id: number,
    public readonly orderId: number,
    public readonly menuItemId: number,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly status: OrderItemStatus = OrderItemStatus.Ordered,
    public readonly paymentId?: number,
    public readonly notes?: string,
  ) {}

  get total(): number {
    return this.quantity * this.unitPrice;
  }

  get isPaid(): boolean {
    return Boolean(this.paymentId) || this.status === OrderItemStatus.Paid;
  }

  markPaid(paymentId: number): OrderItem {
    return new OrderItem(
      this.id,
      this.orderId,
      this.menuItemId,
      this.quantity,
      this.unitPrice,
      OrderItemStatus.Paid,
      paymentId,
      this.notes,
    );
  }
}
