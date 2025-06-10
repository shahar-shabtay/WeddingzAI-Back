import { google } from "googleapis";
import readline from "readline";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const TOKEN_PATH = process.env.GMAIL_TOKEN_PATH || path.join(__dirname, ".gmail-token.json");

async function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function updateEnvFile(envPath: string, key: string, value: string) {
  try {
    let content = "";
    try {
      content = await fs.readFile(envPath, "utf8");
    } catch {
      // File may not exist yet, continue
    }

    const lines = content.split("\n").filter(line => line.trim().length > 0);
    let found = false;

    const newLines = lines.map(line => {
      if (line.startsWith(`${key}=`)) {
        found = true;
        return `${key}=${value}`;
      }
      return line;
    });

    if (!found) newLines.push(`${key}=${value}`);

    await fs.writeFile(envPath, newLines.join("\n") + "\n", "utf8");
    console.log(`✅ Updated ${envPath}`);
  } catch (err) {
    console.error(`❌ Failed to update ${envPath}:`, err);
  }
}

async function main() {
  const credJSON = Buffer.from(process.env.GMAIL_CREDENTIALS_BASE64!, 'base64').toString('utf8');
  const credentials = JSON.parse(credJSON).web;
  const { client_id, client_secret, redirect_uris } = credentials;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting the URL:\n");
  console.log(authUrl, "\n");

  const code = await prompt("Enter the code from that page: ");
  const { tokens } = await oAuth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error("❌ No refresh_token received. Did you check `prompt: 'consent'` and `access_type: 'offline'`?");
    return;
  }

  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`✅ Tokens saved to ${TOKEN_PATH}`);

  const refreshBase64 = Buffer.from(tokens.refresh_token).toString("base64");
  console.log(`🔐 New .env value:\nGMAIL_REFRESH_TOKEN_BASE64=${refreshBase64}\n`);

  const envFiles = [".env.dev", ".env.prod", ".env.tst"];
  for (const envFile of envFiles) {
    await updateEnvFile(path.join(__dirname, envFile), "GMAIL_REFRESH_TOKEN_BASE64", refreshBase64);
  }
}

main().catch((err) => {
  console.error("Error generating token:", err);
});
