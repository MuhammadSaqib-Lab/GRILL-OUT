export interface CustomerJwtPayload {
  sub: string; // Customer.id
  ver: number; // Customer.sessionVersion when the token was issued
}

/** What a logged-in customer is allowed to see about themselves. Never the
 * password hash, session version, or internal ids beyond what's needed. */
export interface CustomerProfile {
  name: string;
  email: string;
}

/** Set on req by requireCustomer — identity always comes from the verified
 * session, never from anything the client sends. */
export interface AuthenticatedCustomer {
  id: string;
  name: string;
  email: string;
}
