import { google } from "googleapis";
import path from "path";
import fs from "fs/promises";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

/**
 * Load OAuth2 client using saved credentials and token.
 */
async function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, "../config/gmail_cred.json");
  const tokenPath = path.join(__dirname, "../config/gmail_token.json");

  const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const token = JSON.parse(await fs.readFile(tokenPath, "utf8"));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

/**
 * Create RFC2822-encoded base64 message.
 */
function createEmail(to: string, subject: string, message: string): string {
  const emailLines = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    message,
  ];

  const email = emailLines.join("\n");
  return Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Send a wedding invitation to one email address.
 */
export async function sendInvitationEmail(
  to: string,
  partner1: string,
  partner2: string,
  weddingDate: string
) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const subject = `💍 You're Invited to ${partner1} & ${partner2}'s Wedding!`;

  const message = `Dear Guest,

You're warmly invited to celebrate the wedding of ${partner1} and ${partner2} 💕
The special day will be on: ${weddingDate}.

Please RSVP at your earliest convenience. We can’t wait to celebrate with you!

With love,
${partner1} & ${partner2}`;

  const raw = createEmail(to, subject, message);

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

/**
 * Send wedding invitations to multiple recipients.
 */
export async function sendInvitationEmails(
  recipients: string[],
  partner1: string,
  partner2: string,
  weddingDate: string
) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const subject = `💍 You're Invited to ${partner1} & ${partner2}'s Wedding!`;

  const message = `Dear Guest,

You're warmly invited to celebrate the wedding of ${partner1} and ${partner2} 💕
The special day will be on: ${weddingDate}.

Please RSVP at your earliest convenience. We can’t wait to celebrate with you!

With love,
${partner1} & ${partner2}`;

  for (const to of recipients) {
    const raw = createEmail(to, subject, message);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  }
}
