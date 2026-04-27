import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "./env";

export const ADMIN_COOKIE = "admin_token";

const ADMIN_TOKEN_EXPIRY = "4h";
const USER_ACCESS_EXPIRY = "15m";
const USER_REFRESH_EXPIRY = "7d";

export type UserRole = "CUSTOMER" | "DISTRIBUTOR" | "ADMIN";

export type AdminSessionPayload = {
  role: "admin";
};

export type UserSessionPayload = {
  userId: string;
  phone: string;
  role: UserRole;
};

function adminKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}
function userAccessKey(): Uint8Array {
  return new TextEncoder().encode(env.USER_ACCESS_SECRET);
}
function userRefreshKey(): Uint8Array {
  return new TextEncoder().encode(env.USER_REFRESH_SECRET);
}

async function sign(payload: JWTPayload, key: Uint8Array, expiry: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(key);
}

async function verify<T>(token: string, key: Uint8Array): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}

export const adminSession = {
  sign: () => sign({ role: "admin" }, adminKey(), ADMIN_TOKEN_EXPIRY),
  verify: (token: string) => verify<AdminSessionPayload & JWTPayload>(token, adminKey()),
  expirySeconds: 60 * 60 * 4,
};

export const userSession = {
  signAccess: (p: UserSessionPayload) => sign({ ...p }, userAccessKey(), USER_ACCESS_EXPIRY),
  signRefresh: (p: UserSessionPayload) => sign({ ...p }, userRefreshKey(), USER_REFRESH_EXPIRY),
  verifyAccess: (token: string) => verify<UserSessionPayload & JWTPayload>(token, userAccessKey()),
  verifyRefresh: (token: string) => verify<UserSessionPayload & JWTPayload>(token, userRefreshKey()),
  accessExpirySeconds: 15 * 60,
};
