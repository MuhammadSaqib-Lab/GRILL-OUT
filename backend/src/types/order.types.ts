export type OrderType = "pickup" | "delivery";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

/** What the client sends: which item/option and how many. Never a price —
 * prices are always resolved server-side from the menu repository. */
export interface OrderLineInput {
  menuItemId: number;
  optionLabel?: string;
  quantity: number;
}

/** A priced, resolved line as stored on the order. */
export interface OrderLine {
  menuItemId: number | null;
  name: string;
  optionLabel?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: OrderType;
  deliveryAddress?: string;
  specialInstructions?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
