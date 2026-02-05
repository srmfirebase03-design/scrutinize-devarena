
import { google } from 'googleapis';
import 'dotenv/config';
import fs from 'fs';
import Papa from 'papaparse';

const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';
const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });

async function listFiles(folderId: string) {
    const allFiles: any[] = [];
    const visited = new Set<string>();
    async function scan(id: string) {
        if (visited.has(id)) return;
        visited.add(id);
        const res = await drive.files.list({
            q: `'${id}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, shortcutDetails)',
        });
        for (const file of res.data.files || []) {
            let actualId = file.id!;
            let mimeType = file.mimeType!;
            if (mimeType === 'application/vnd.google-apps.shortcut') {
                actualId = file.shortcutDetails!.targetId!;
                mimeType = file.shortcutDetails!.targetMimeType!;
            }
            if (mimeType === 'application/vnd.google-apps.folder') await scan(actualId);
            else allFiles.push({ ...file, id: actualId, mimeType });
        }
    }
    await scan(folderId);
    return allFiles;
}

async function main() {
    const files = await listFiles(DRIVE_FOLDER_ID);
    const csvContent = fs.readFileSync('public/data/hackathon.csv', 'utf8');
    const csvTeams = Papa.parse(csvContent, { header: true }).data as any[];
    
    console.log('--- DRIVE FILES LIST ---');
    files.forEach(f => {
        const clean = f.name.replace(/\.[^/.]+$/, "");
        console.log(`File: "${f.name}" | Clean: "${clean}"`);
    });

    console.log('\n--- CSV TEAMS ---');
    csvTeams.forEach(t => {
        if (t['TEAM NAME']) console.log(`Team: "${t['TEAM NAME']}"`);
    });
}
main();
