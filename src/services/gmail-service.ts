import { google } from "googleapis";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

dotenv.config();

async function getOAuth2Client() {
  const credJSON = Buffer.from(process.env.GMAIL_CREDENTIALS_BASE64!, 'base64').toString('utf8');
  const tokenJSON = Buffer.from(process.env.GMAIL_TOKEN_BASE64!, 'base64').toString('utf8');

  const credentials = JSON.parse(credJSON).installed;
  const token = JSON.parse(tokenJSON);

  const { client_id, client_secret, redirect_uris } = credentials;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Encode subject line for proper UTF-8 handling with emojis or non-ASCII characters.
 */
function encodeSubject(subject: string): string {
  const encoded = Buffer.from(subject, "utf8").toString("base64");
  return `=?utf-8?B?${encoded}?=`;
}

/**
 * Create base64 RFC2822 formatted email.
 */
function createEmail(to: string, subject: string, message: string): string {
  const emailLines = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${encodeSubject(subject)}`,
    "",
    message,
  ];

  const email = emailLines.join("\n");
  return Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Load and fill the invitation message template.
 */
async function loadInvitationMessage(
  partner1: string,
  partner2: string,
  weddingDate: string
): Promise<string> {
  const templatePath = path.join(__dirname, "./email-templates/invitation-template.txt");
  let content = await fs.readFile(templatePath, "utf8");

  return content
    .replace(/{{partner1}}/g, partner1)
    .replace(/{{partner2}}/g, partner2)
    .replace(/{{weddingDate}}/g, weddingDate);
}

/**
 * Send a wedding invitation to a single guest.
 */
export async function sendInvitationEmail(
  to: string,
  partner1: string,
  partner2: string,
  weddingDate: string
) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const subject = `💌 Save the Date: ${partner1} ❤️ ${partner2} Are Getting Married!`;
  const message = await loadInvitationMessage(partner1, partner2, weddingDate);
  const raw = createEmail(to, subject, message);

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

/**
 * Send wedding invitations to multiple guests.
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
  const message = await loadInvitationMessage(partner1, partner2, weddingDate);

  for (const to of recipients) {
    const raw = createEmail(to, subject, message);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  }
}