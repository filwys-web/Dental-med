import nodemailer from "nodemailer";
import { contactLimits } from "../../../lib/contact-form";

export const runtime = "nodejs";

function readField(value: unknown, maxLength: number) {
  if (typeof value !== "string" || value.length > maxLength) return "";
  return value.trim();
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") {
    return new Response(null, { status: 415 });
  }

  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return new Response(null, { status: 400 });
  }

  const fields = data as Record<string, unknown>;
  const name = readField(fields.name, contactLimits.name);
  const email = readField(fields.email, contactLimits.email);
  const subject = readField(fields.subject, contactLimits.subject);
  const message = readField(fields.message, contactLimits.message);

  const validEmail = /^[^\s@<>,:;"()\[\]\\]+@[^\s@<>,:;"()\[\]\\]+\.[^\s@<>,:;"()\[\]\\]+$/;
  if (!name || !validEmail.test(email) || !subject || /[\r\n]/.test(subject) || !message) {
    return new Response(null, { status: 400 });
  }

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASWORD?.replace(/\s/g, "");
  const to = process.env.CONTACT_TO?.trim();

  if (!user || !pass || !to) {
    console.error("Contact email configuration is incomplete.");
    return new Response(null, { status: 503 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporter.sendMail({
      from: { name: "Dental Med", address: user },
      to,
      replyTo: { name, address: email },
      subject: `[Dental Med] ${subject}`,
      text: `Imię i nazwisko: ${name}\nE-mail: ${email}\n\n${message}`,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : "UNKNOWN";
    console.error("Contact email could not be sent.", code);
    return new Response(null, { status: 502 });
  }
}
