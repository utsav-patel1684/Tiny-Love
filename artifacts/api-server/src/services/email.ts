import { Resend } from "resend";
import { logger } from "../lib/logger";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}
const FROM = process.env.FROM_EMAIL ?? "tinylove@kretoss.in";

function otpEmailHtml(otp: string, purpose: "verify" | "reset"): string {
  const heading = purpose === "verify" ? "Verify your email" : "Reset your password";
  const body =
    purpose === "verify"
      ? "You're one step away from your family's private memory space. Enter the code below to verify your email:"
      : "We received a request to reset your TinyLove password. Use the code below — it expires in 10 minutes:";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:40px 0;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header bar -->
        <tr>
          <td style="background:#5F7A68;padding:28px 40px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
              🌿 TinyLove
            </p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">
              Private family memories
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 16px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1A1A1A;letter-spacing:-0.5px;">
              ${heading}
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
              ${body}
            </p>

            <!-- OTP box -->
            <div style="background:#F4F1EC;border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#5F7A68;letter-spacing:1.5px;text-transform:uppercase;">
                Your code
              </p>
              <p style="margin:0;font-size:44px;font-weight:800;color:#1A1A1A;letter-spacing:12px;font-variant-numeric:tabular-nums;">
                ${otp}
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#999;">
                Expires in 10 minutes
              </p>
            </div>

            <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
              Your account won't be affected.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 40px 32px;border-top:1px solid #F0ECE5;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
              © ${new Date().getFullYear()} TinyLove · Private family memories<br>
              ${FROM}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: "verify" | "reset"
): Promise<void> {
  const subject =
    purpose === "verify"
      ? `${otp} — Verify your TinyLove email`
      : `${otp} — Your TinyLove password reset code`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: otpEmailHtml(otp, purpose),
  });

  if (error) {
    logger.error({ to, purpose, error }, "Resend email failed");
    throw new Error("Failed to send email. Please try again.");
  }

  logger.info({ to, purpose }, "OTP email sent");
}
