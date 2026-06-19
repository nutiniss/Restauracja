export class Waiter {
  constructor(
    public readonly id: number,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly code: string,
    public readonly isActive: boolean = true,
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
