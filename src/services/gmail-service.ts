import { google } from "googleapis";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import invitationModel from "../models/invitation-model";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const TOKEN_PATH = process.env.GMAIL_TOKEN_PATH || "./.gmail-token.json";

async function getOAuth2Client() {
  // 1. Decode and parse credentials
  const credJSON = Buffer.from(process.env.GMAIL_CREDENTIALS_BASE64!, 'base64').toString('utf8');
  const credentials = JSON.parse(credJSON).web;
  const { client_id, client_secret, redirect_uris } = credentials;

  // 2. Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // 3. Load refresh token from .env (Base64-decoded)
  const refreshToken = Buffer.from(process.env.GMAIL_REFRESH_TOKEN_BASE64!, 'base64').toString('utf8');

  // 4. Set credentials with just the refresh_token
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    // 5. Force refresh access token immediately
    const { credentials: newToken } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(newToken);
  } catch (error) {
    console.error("Failed to refresh Gmail token", error);
  }

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
  return `${domainBase}/api/guests/rsvp?guestId=${guestId}&token=${token}&response=${type}`;
}

async function loadInvitationMessage(
  partner1: string,
  partner2: string,
  guestName: string,
  guestId: string,
  rsvpToken: string,
  weddingDate?: string,
  venue?: string
): Promise<string> {
  const hasDate = weddingDate && weddingDate.toLowerCase() !== 'tbd';
  const hasVenue = venue && venue.toLowerCase() !== 'tbd';

  let templateFile = "invitation-template-none.html";
  if (hasDate && hasVenue) {
    templateFile = "invitation-template-full.html";
  } else if (hasDate) {
    templateFile = "invitation-template-dateOnly.html";
  }

  const templatePath = path.join(__dirname, `../templates/${templateFile}`);
  let content = await fs.readFile(templatePath, "utf8");

  return content
    .replace(/{{partner1}}/g, partner1)
    .replace(/{{partner2}}/g, partner2)
    .replace(/{{guestName}}/g, guestName)
    .replace(/{{weddingDate}}/g, hasDate ? weddingDate : "To Be Determined")
    .replace(/{{venue}}/g, hasVenue ? venue : "To Be Determined")
    .replace(/{{rsvpYesLink}}/g, createRSVPLink('yes', guestId, rsvpToken))
    .replace(/{{rsvpNoLink}}/g, createRSVPLink('no', guestId, rsvpToken))
    .replace(/{{rsvpMaybeLink}}/g, createRSVPLink('maybe', guestId, rsvpToken));
}

interface GuestInfo {
  email: string;
  fullName: string;
  guestId: string;
  rsvpToken: string;
  userId: string;
}

export async function sendInvitationEmails(
  guests: GuestInfo[],
  partner1: string,
  partner2: string,
  weddingDate?: string,
  venue?: string
) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth });

  const subject = `💍 You're Invited to ${partner1} & ${partner2}'s Wedding!`;

  for (const guest of guests) {
    const message = await loadInvitationMessage(
      partner1,
      partner2,
      guest.fullName,
      guest.guestId,
      guest.rsvpToken,
      weddingDate,
      venue
    );

    // Try to load invitation (PNG) if exists
    const invitation = await invitationModel.findOne({ userId: guest.userId });
    let attachment = null;

    if (invitation?.finalPng) {
      try {
        const invitationPath = path.join(process.cwd(), "uploads", "invitation", invitation.userId, "final.png");

        const pngBuffer = await fs.readFile(invitationPath);
        const pngBase64 = pngBuffer.toString("base64");

        attachment = {
          filename: "wedding-invitation.png",
          content: pngBase64,
          mimeType: "image/png",
        };
      } catch (err) {
        console.warn(`⚠️ Could not read invitation PNG for ${guest.email}`, err);
      }
    }

    const emailLines = [
      `To: ${guest.email}`,
      "Content-Type: multipart/mixed; boundary=boundary123",
      "MIME-Version: 1.0",
      `Subject: ${encodeSubject(subject)}`,
      "",
      "--boundary123",
      "Content-Type: text/html; charset=utf-8",
      "",
      message,
    ];

    if (attachment) {
      emailLines.push(
        "--boundary123",
        `Content-Type: ${attachment.mimeType}; name=${attachment.filename}`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        "",
        attachment.content
      );
    }

    emailLines.push("--boundary123--");

    const raw = Buffer.from(emailLines.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
  }
}
