import { google } from 'googleapis';
import 'dotenv/config';

const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });

async function main() {
    console.log('Fetching items from Drive (checking for folders and shortcuts)...\n');
    try {
        const res = await drive.files.list({
            q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, shortcutDetails)',
        });

        const files = res.data.files || [];
        if (files.length === 0) {
            console.log('No items found.');
            return;
        }

        for (const file of files) {
            console.log(`- ${file.name} | Type: ${file.mimeType} | ID: ${file.id}`);
            if (file.mimeType === 'application/vnd.google-apps.shortcut') {
                console.log(`  -> Shortcut target: ${file.shortcutDetails?.targetMimeType} (${file.shortcutDetails?.targetId})`);
            }
        }
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main();