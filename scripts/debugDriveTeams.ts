import { google } from 'googleapis';
import 'dotenv/config';

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
        const files = res.data.files || [];
        for (const file of files) {
            let actualId = file.id!;
            let mimeType = file.mimeType!;
            if (mimeType === 'application/vnd.google-apps.shortcut') {
                actualId = file.shortcutDetails!.targetId!;
                mimeType = file.shortcutDetails!.targetMimeType!;
            }

            if (mimeType === 'application/vnd.google-apps.folder') {
                await scan(actualId);
            } else {
                allFiles.push({ ...file, id: actualId, mimeType });
            }
        }
    }
    await scan(folderId);
    return allFiles;
}

async function main() {
    const files = await listFiles(DRIVE_FOLDER_ID);
    const driveTeams = new Set<string>();
    const teamToFile = new Map<string, string>();

    files.forEach(f => {
        const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
        let teamName = "";
        if (nameWithoutExt.includes('_')) {
            teamName = nameWithoutExt.split('_').slice(1).join('_').trim();
        } else {
            teamName = nameWithoutExt.trim();
        }
        
        if (teamName) {
            const normalized = teamName.toLowerCase().replace(/\s+/g, '');
            driveTeams.add(normalized);
            teamToFile.set(normalized, teamName);
        }
    });
    
    console.log('Unique Normalized Team Names in DRIVE:', driveTeams.size);
    console.log('Matched Files total:', files.length);
}
main();