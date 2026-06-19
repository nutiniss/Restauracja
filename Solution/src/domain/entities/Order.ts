import {OrderStatus} from '../enums/RestaurantEnums';

export class Order {
  constructor(
    public readonly id: number,
    public readonly tableId: number,
    public readonly waiterId: number,
    public readonly openedAt: string,
    public readonly status: OrderStatus = OrderStatus.Open,
    public readonly closedAt?: string,
    public readonly notes?: string,
  ) {}

  updateStatus(status: OrderStatus, closedAt?: string): Order {
    return new Order(
      this.id,
      this.tableId,
      this.waiterId,
      this.openedAt,
      status,
      closedAt,
      this.notes,
    );
  }
}
