import "server-only";
import { cookies } from "next/headers";
import { userSession, type UserSessionPayload } from "./session";

export const DIST_COOKIE = "dist_session";

export type DistributorSession = UserSessionPayload & { exp?: number };

export async function getDistributorSession(): Promise<DistributorSession | null> {
  const jar = await cookies();
  const token = jar.get(DIST_COOKIE)?.value;
  if (!token) return null;

  const payload = await userSession.verifyAccess(token);
  if (!payload?.userId || payload.role !== "DISTRIBUTOR") return null;

  return payload as DistributorSession;
}
