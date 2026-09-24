import { customerRepository } from "../repositories/customer.repository";
import type { CustomerProfile } from "../types/customer.types";
import { ApiError } from "../utils/ApiError";
import { signCustomerToken } from "../utils/customerToken";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../utils/password";
import type { CustomerLoginInput, CustomerSignupInput } from "../validators/customer.validator";

function toProfile(c: { name: string; loginEmail: string | null }): CustomerProfile {
  return { name: c.name, email: c.loginEmail ?? "" };
}

export const customerAuthService = {
  async signup(input: CustomerSignupInput): Promise<{ token: string; profile: CustomerProfile }> {
    // Friendly early answer; the unique index still decides races.
    if (await customerRepository.findByLoginEmail(input.email)) {
      throw ApiError.conflict("An account with this email already exists. Try logging in instead.");
    }
    const customer = await customerRepository.createAccount({
      name: input.name,
      loginEmail: input.email,
      passwordHash: await hashPassword(input.password),
    });
    return { token: signCustomerToken({ sub: customer.id, ver: customer.sessionVersion }), profile: toProfile(customer) };
  },

  async login(input: CustomerLoginInput): Promise<{ token: string; profile: CustomerProfile }> {
    const customer = await customerRepository.findByLoginEmail(input.email);
    // Legacy guest rows have no passwordHash and can never log in.
    if (!customer || !customer.passwordHash) {
      await burnPasswordCheck(input.password); // same work either way — no timing oracle
      throw ApiError.unauthorized("Incorrect email or password");
    }
    if (!(await verifyPassword(input.password, customer.passwordHash))) {
      throw ApiError.unauthorized("Incorrect email or password");
    }
    return { token: signCustomerToken({ sub: customer.id, ver: customer.sessionVersion }), profile: toProfile(customer) };
  },

  /** Revokes every session this customer has (all devices). Silent no-op if
   * there was no valid session — logging out twice must not error. */
  async logout(customerId: string | undefined): Promise<void> {
    if (customerId) await customerRepository.bumpSessionVersion(customerId);
  },
};
