export class MenuItem {
  constructor(
    public readonly id: number,
    public readonly categoryId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly isAvailable: boolean = true,
    public readonly imageUrl?: string,
  ) {}
}
