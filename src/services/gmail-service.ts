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

function encodeSubject(subject: string): string {
  const encoded = Buffer.from(subject, "utf8").toString("base64");
  return `=?utf-8?B?${encoded}?=`;
}

function createEmail(to: string, subject: string, html: string): string {
  const emailLines = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${encodeSubject(subject)}`,
    "",
    html,
  ];

  const email = emailLines.join("\n");
  return Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createRSVPLink(type: 'yes' | 'no' | 'maybe', guestId: string, token: string): string {
  const domainBase = process.env.DOMAIN_BASE || "http://localhost:4000";
  return `${domainBase}/api/rsvp?guestId=${guestId}&token=${token}&response=${type}`;
}

async function loadInvitationMessage(
  partner1: string,
  partner2: string,
  weddingDate: string,
  guestName: string,
  guestId: string,
  rsvpToken: string
): Promise<string> {
  const templatePath = path.join(__dirname, "../templates/invitation-template.html");
  let content = await fs.readFile(templatePath, "utf8");

  return content
    .replace(/{{partner1}}/g, partner1)
    .replace(/{{partner2}}/g, partner2)
    .replace(/{{weddingDate}}/g, weddingDate)
    .replace(/{{guestName}}/g, guestName)
    .replace(/{{rsvpYesLink}}/g, createRSVPLink('yes', guestId, rsvpToken))
    .replace(/{{rsvpNoLink}}/g, createRSVPLink('no', guestId, rsvpToken))
    .replace(/{{rsvpMaybeLink}}/g, createRSVPLink('maybe', guestId, rsvpToken));
}

export async function sendInvitationEmail(
  to: string,
  guestName: string,
  guestId: string,
  rsvpToken: string,
  partner1: string,
  partner2: string,
  weddingDate: string
) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const subject = `💌 Save the Date: ${partner1} ❤️ ${partner2} Are Getting Married!`;
  const message = await loadInvitationMessage(partner1, partner2, weddingDate, guestName, guestId, rsvpToken);
  const raw = createEmail(to, subject, message);

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

interface GuestInfo {
  email: string;
  fullName: string;
  guestId: string;
  rsvpToken: string;
}

export async function sendInvitationEmails(
  guests: GuestInfo[],
  partner1: string,
  partner2: string,
  weddingDate: string
) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const subject = `💍 You're Invited to ${partner1} & ${partner2}'s Wedding!`;

  for (const guest of guests) {
    const message = await loadInvitationMessage(
      partner1,
      partner2,
      weddingDate,
      guest.fullName,
      guest.guestId,
      guest.rsvpToken
    );
    const raw = createEmail(guest.email, subject, message);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  }
}
