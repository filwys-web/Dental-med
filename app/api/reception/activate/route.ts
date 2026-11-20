import { createHash, timingSafeEqual } from "node:crypto";
import { appointmentResponse, isJsonRequest } from "../../../../lib/appointments-server";
import { isSameOrigin, receptionAuthRequest } from "../../../../lib/reception-session";

const invalid = "Link aktywacyjny jest nieprawidłowy lub wygasł.";

export async function POST(request: Request) {
  if (!isSameOrigin(request) || !isJsonRequest(request)) return appointmentResponse({ message: invalid }, 403);

  const { code, password } = (await request.json().catch(() => null)) ?? {};
  if (typeof code !== "string" || !/^[a-f0-9]{64}$/.test(code)) {
    return appointmentResponse({ message: invalid }, 403);
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 72) {
    return appointmentResponse({ message: "Wybierz hasło od 12 do 72 znaków." }, 400);
  }

  try {
    const { email, hash, expiresAt } = JSON.parse(process.env.RECEPTION_INVITATION ?? "{}");
    const presented = createHash("sha256").update(code).digest();
    if (
      typeof email !== "string" || typeof expiresAt !== "number" || expiresAt <= Date.now() ||
      typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash) ||
      !timingSafeEqual(presented, Buffer.from(hash, "hex"))
    ) return appointmentResponse({ message: invalid }, 403);

    const result = await receptionAuthRequest("admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        app_metadata: { clinic_role: "receptionist" },
      }),
    }, true);
    if (result.ok) return appointmentResponse({}, 201);

    const { code: authCode } = await result.json().catch(() => ({}));
    if (authCode === "email_exists" || authCode === "user_already_exists") {
      return appointmentResponse({ message: "Konto już istnieje. Zaloguj się w panelu recepcji." }, 409);
    }
    if (authCode === "weak_password" || authCode === "validation_failed") {
      return appointmentResponse({ message: "Supabase odrzucił hasło. Wybierz inne hasło o odpowiedniej długości." }, 400);
    }
    throw new Error("Could not create reception account");
  } catch {
    return appointmentResponse({ message: "Aktywacja jest chwilowo niedostępna." }, 503);
  }
}
