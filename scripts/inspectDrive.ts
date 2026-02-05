import { google } from 'googleapis';
import 'dotenv/config';

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });

async function inspectDrive(folderId: string, indent = '') {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });

    const files = res.data.files || [];
    console.log(`${indent}Folder ID: ${folderId} contains ${files.length} items`);

    for (const file of files) {
      console.log(`${indent}- ${file.name} (${file.mimeType}) [ID: ${file.id}]`);
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        await inspectDrive(file.id!, indent + '  ');
      }
    }
  } catch (error: any) {
    console.error(`Error inspecting folder ${folderId}:`, error.message);
  }
}

const targetFolderId = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';
console.log(`Starting inspection of ${targetFolderId}...
`);
inspectDrive(targetFolderId);
