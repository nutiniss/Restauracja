import { TableStatus } from '../enums/RestaurantEnums';

export class RestaurantTable {
  constructor(
    public readonly id: number,
    public readonly number: number,
    public readonly seats: number,
    public readonly zone: string,
    public readonly status: TableStatus = TableStatus.Free,
    public readonly waiterId?: number,
    public readonly orderId?: number,
  ) {}

  assignOrder(orderId: number, waiterId: number): RestaurantTable {
    return new RestaurantTable(
      this.id,
      this.number,
      this.seats,
      this.zone,
      TableStatus.Occupied,
      waiterId,
      orderId,
    );
  }

  updateStatus(status: TableStatus): RestaurantTable {
    return new RestaurantTable(
      this.id,
      this.number,
      this.seats,
      this.zone,
      status,
      this.waiterId,
      this.orderId,
    );
  }

  release(): RestaurantTable {
    return new RestaurantTable(
      this.id,
      this.number,
      this.seats,
      this.zone,
      TableStatus.Free,
    );
  }
}
