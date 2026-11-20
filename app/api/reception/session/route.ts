import { NextResponse } from "next/server";
import { appointmentResponse, isJsonRequest } from "../../../../lib/appointments-server";
import {
  isReceptionist,
  isSameOrigin,
  receptionAuthRequest,
  receptionCookieName,
  receptionCookieOptions,
} from "../../../../lib/reception-session";

const authFailure = "Sprawdź dane logowania i uprawnienia do panelu recepcji.";

export async function POST(request: Request) {
  if (!isSameOrigin(request) || !isJsonRequest(request)) return appointmentResponse({ message: authFailure }, 403);
  const { email, password } = (await request.json().catch(() => null)) ?? {};
  if (typeof email !== "string" || email.length > 254 || typeof password !== "string" ||
      password.length === 0 || password.length > 1024) return appointmentResponse({ message: authFailure }, 400);

  try {
    const result = await receptionAuthRequest("token?grant_type=password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (result.status === 429) return appointmentResponse({ message: "Odczekaj chwilę przed kolejną próbą." }, 429);
    if (result.status === 400 || result.status === 401 || result.status === 403) {
      return appointmentResponse({ message: authFailure }, 401);
    }
    if (!result.ok) throw new Error("Auth request failed");

    const { access_token, expires_in, user } = await result.json();
    if (!user || !isReceptionist(user)) return appointmentResponse({ message: authFailure }, 403);
    if (typeof access_token !== "string" || !Number.isInteger(expires_in) || expires_in <= 0) {
      throw new Error("Invalid Auth response");
    }
    const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    response.cookies.set(receptionCookieName, access_token, {
      ...receptionCookieOptions,
      maxAge: Math.min(expires_in, 3600),
    });
    return response;
  } catch {
    return appointmentResponse({ message: "Logowanie jest chwilowo niedostępne." }, 503);
  }
}

export function DELETE(request: Request) {
  if (!isSameOrigin(request)) return appointmentResponse({ message: authFailure }, 403);
  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  response.cookies.set(receptionCookieName, "", { ...receptionCookieOptions, maxAge: 0 });
  return response;
}
