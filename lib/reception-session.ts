import { cookies } from "next/headers";
import { getClinicTime } from "./clinic-time";

export const receptionCookieName = "dental-med-reception";
export const receptionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
} as const;

export function receptionAuthRequest(path: string, init?: RequestInit, admin = false) {
  const projectUrl = process.env.SUPABASE_URL;
  const key = admin ? process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!projectUrl || !key) throw new Error("Supabase Auth configuration is missing");
  const headers = new Headers(init?.headers);
  headers.set("apikey", key);
  if (admin && key.startsWith("eyJ")) headers.set("Authorization", `Bearer ${key}`);
  return fetch(new URL(`/auth/v1/${path}`, projectUrl), {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(8_000),
  });
}

export async function getReceptionInitialDay() {
  const signedIn = await hasReceptionSession().catch(() => false);
  return signedIn ? getClinicTime(Date.now()).day : null;
}

export function isReceptionist(user: { app_metadata?: { clinic_role?: string }; is_anonymous?: boolean }) {
  return !user.is_anonymous && user.app_metadata?.clinic_role === "receptionist";
}

export async function hasReceptionSession() {
  const token = (await cookies()).get(receptionCookieName)?.value;
  if (!token) return false;
  const response = await receptionAuthRequest("user", { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401 || response.status === 403) return false;
  if (!response.ok) throw new Error("Could not verify reception session");
  return isReceptionist(await response.json());
}

export function isSameOrigin(request: Request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}
