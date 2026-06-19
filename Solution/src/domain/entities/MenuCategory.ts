export class MenuCategory {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string,
    public readonly displayOrder: number,
    public readonly isActive: boolean = true,
  ) {}
}
