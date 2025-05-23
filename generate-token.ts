import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import open from 'open';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const CREDENTIALS_PATH = path.join('/Users/I761928/creds.json');
const TOKEN_PATH = path.join('/Users/I761928/token.json');

function readCredentials(): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(CREDENTIALS_PATH, 'utf8', (err, data) => {
      if (err) return reject(err);
      resolve(JSON.parse(data));
    });
  });
}

function saveToken(token: any): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  console.log(`✅ Token saved to ${TOKEN_PATH}`);
}

async function getNewToken(oAuth2Client: any) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('🔗 Authorize this app by visiting the URL:\n', authUrl);
  await open(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\n📥 Enter the code from that page here: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      saveToken(tokens);
    } catch (err) {
      console.error('❌ Error retrieving access token', err);
    }
  });
}

async function main() {
  try {
    const credentials = await readCredentials();
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    await getNewToken(oAuth2Client);
  } catch (err) {
    console.error('❌ Failed to generate token:', err);
  }
}

main();
