/** Admin dashboard domain types. Grouped in one file the same way the admin
 * repositories/services/controllers are (see those files' header comments)
 * — six new resources sharing one cohesive "admin" concern didn't warrant
 * repeating the public API's one-file-per-resource pattern six more times. */

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
}

export interface AdminJwtPayload {
  sub: string; // AdminUser.id
  email: string;
  ver: number; // AdminUser.sessionVersion at the time the token was issued
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  todaysOrders: number;
  totalReservations: number;
  todaysReservations: number;
  totalCustomers: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  ordersByStatus: Record<string, number>;
}

export interface PopularMenuItem {
  menuItemId: number;
  name: string;
  image: string;
  quantitySold: number;
  revenue: number;
}

export interface AdminOrderSummary {
  id: string;
  customerName: string;
  phone: string;
  orderType: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface AdminReservationSummary {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: string;
  specialRequests?: string;
  adminMessage?: string;
  status: string;
  createdAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  email?: string;
  phone: string | null;
  /** "account" = registered on the website; "guest" = placed orders before accounts existed. */
  kind: "account" | "guest";
  createdAt: string;
  orders: Array<{
    id: string;
    status: string;
    orderType: string;
    total: number;
    itemCount: number;
    adminMessage?: string;
    createdAt: string;
  }>;
  reservations: Array<{
    id: string;
    status: string;
    date: string;
    time: string;
    guests: string;
    adminMessage?: string;
    createdAt: string;
  }>;
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  /** Own phone, else the phone from their most recent order (accounts have none of their own). */
  phone: string | null;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  reservationCount: number;
  createdAt: string;
}
