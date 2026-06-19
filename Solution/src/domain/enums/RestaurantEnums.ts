export enum TableStatus {
  Free = 'free',
  Occupied = 'occupied',
  PartiallyPaid = 'partiallyPaid',
  Paid = 'paid',
}

export enum OrderStatus {
  Open = 'open',
  PartiallyPaid = 'partiallyPaid',
  Paid = 'paid',
  Cancelled = 'cancelled',
}

export enum OrderItemStatus {
  Ordered = 'ordered',
  Served = 'served',
  Paid = 'paid',
  Cancelled = 'cancelled',
}

export enum PaymentStatus {
  Completed = 'completed',
  Cancelled = 'cancelled',
}
