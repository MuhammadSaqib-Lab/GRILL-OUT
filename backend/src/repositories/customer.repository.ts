import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export const customerRepository = {
  findByLoginEmail(loginEmail: string) {
    return prisma.customer.findUnique({ where: { loginEmail } });
  },

  findById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  },

  /** Creates an account. The unique index on loginEmail is the real guard
   * against two signups racing for the same address; the caller's pre-check is
   * only there for a friendlier message. */
  async createAccount(data: { name: string; loginEmail: string; passwordHash: string }) {
    try {
      return await prisma.customer.create({
        data: {
          name: data.name,
          loginEmail: data.loginEmail,
          email: data.loginEmail,
          passwordHash: data.passwordHash,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw ApiError.conflict("An account with this email already exists. Try logging in instead.");
      }
      throw err;
    }
  },

  async bumpSessionVersion(id: string): Promise<void> {
    await prisma.customer.updateMany({ where: { id }, data: { sessionVersion: { increment: 1 } } });
  },
};
