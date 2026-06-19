export class PaymentMethod {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly isActive: boolean = true,
  ) {}
}
