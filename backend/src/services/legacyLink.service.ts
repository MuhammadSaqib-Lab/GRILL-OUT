import { prisma } from "../config/prisma";

/**
 * Orders and reservations placed BEFORE customer accounts existed belong to a
 * passwordless "guest" customer row (or to nobody). They are never attached to
 * an account automatically: anyone can type someone else's email into the
 * signup form, and without email verification that would hand them the real
 * owner's order history.
 *
 * This is the deliberate alternative — run by an operator (see
 * scripts/link-legacy-orders.ts) after they've confirmed the person really
 * owns the address. It only ever moves records that are currently owned by a
 * guest row or by nobody, never records that already belong to a real account.
 */
export async function linkLegacyRecords(options: { email: string; apply: boolean }) {
  const email = options.email.trim().toLowerCase();
  const account = await prisma.customer.findUnique({ where: { loginEmail: email } });
  if (!account || !account.passwordHash) {
    return { accountFound: false, orders: 0, reservations: 0, applied: false };
  }

  // Only records currently owned by nobody or by a guest (no-password) row.
  const legacyOwner = { OR: [{ customerId: null }, { customer: { passwordHash: null } }] };
  const orderWhere = { email: { equals: email, mode: "insensitive" as const }, ...legacyOwner };
  const reservationWhere = { email: { equals: email, mode: "insensitive" as const }, ...legacyOwner };

  const [orders, reservations] = await Promise.all([
    prisma.order.count({ where: orderWhere }),
    prisma.reservation.count({ where: reservationWhere }),
  ]);

  if (options.apply && (orders > 0 || reservations > 0)) {
    await prisma.$transaction([
      prisma.order.updateMany({ where: orderWhere, data: { customerId: account.id } }),
      prisma.reservation.updateMany({ where: reservationWhere, data: { customerId: account.id } }),
    ]);
  }
  return { accountFound: true, orders, reservations, applied: options.apply };
}
