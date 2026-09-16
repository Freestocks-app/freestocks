import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = "Freestocks <noreply@freestocks.app>";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set - verification emails will not be sent.");
    return null;
  }
  if (!client) {
    client = new Resend(RESEND_API_KEY);
  }
  return client;
}

function verificationEmailHtml(url: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:420px;background:#161616;border:1px solid #2b2b2b;border-radius:16px;padding:32px 24px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:20px;font-weight:700;color:#ffffff;">Freestocks</span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <span style="font-size:18px;font-weight:700;color:#ffffff;">Verify your email</span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:14px;color:#a0a0a0;line-height:1.5;">
                  Confirm your email address to start earning stocks on Freestocks.
                </span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${url}" style="display:inline-block;background:#d4fc50;color:#0a0a0a;font-weight:700;font-size:14px;padding:14px 32px;border-radius:8px;text-decoration:none;">
                  Verify Email
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <span style="font-size:11px;color:#6b6b6b;">
                  If you didn't create a Freestocks account, you can ignore this email.
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

/**
 * Sends the email-verification link via Resend. Never throws - a failed
 * send should never surface as a 500 to the user mid-signup; better-auth's
 * sendVerificationEmail contract expects this to be fire-and-forget-safe.
 */
export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Verify your Freestocks email",
      html: verificationEmailHtml(url),
    });
    if (error) {
      console.error("[email] Resend returned an error sending verification email:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send verification email:", err);
  }
}
