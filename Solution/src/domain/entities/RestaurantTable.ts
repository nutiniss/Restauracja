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
    public readonly isActive: boolean = true,
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
      this.isActive,
    );
  }

  assignWaiter(waiterId: number): RestaurantTable {
    return new RestaurantTable(
      this.id,
      this.number,
      this.seats,
      this.zone,
      this.status,
      waiterId,
      this.orderId,
      this.isActive,
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
      this.isActive,
    );
  }

  release(): RestaurantTable {
    return new RestaurantTable(
      this.id,
      this.number,
      this.seats,
      this.zone,
      TableStatus.Free,
      undefined,
      undefined,
      this.isActive,
    );
  }

  deactivate(): RestaurantTable {
    return new RestaurantTable(
      this.id,
      this.number,
      this.seats,
      this.zone,
      TableStatus.Free,
      undefined,
      undefined,
      false,
    );
  }
}
