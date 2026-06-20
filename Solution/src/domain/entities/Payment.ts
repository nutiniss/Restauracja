import { PaymentStatus } from '../enums/RestaurantEnums';

export class Payment {
  constructor(
    public readonly id: number,
    public readonly orderId: number,
    public readonly paymentMethodId: number,
    public readonly amount: number,
    public readonly tipAmount: number,
    public readonly paidAt: string,
    public readonly status: PaymentStatus = PaymentStatus.Completed,
  ) {}
}
