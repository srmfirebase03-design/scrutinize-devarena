
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
    
    const matches: any[] = [];

    for (const file of files) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        let teamNameFromDrive = "";
        if (cleanName.includes('_')) teamNameFromDrive = cleanName.split('_').slice(1).join('_');
        else if (cleanName.includes(' - ')) teamNameFromDrive = cleanName.split(' - ').slice(1).join(' - ');
        else teamNameFromDrive = cleanName;
        
        teamNameFromDrive = teamNameFromDrive.replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "").trim();

        const matchingCsvTeam = csvTeams.find(t => 
          t['TEAM NAME'] && t['TEAM NAME'].toLowerCase().trim() === teamNameFromDrive.toLowerCase().trim()
        );

        if (matchingCsvTeam) {
            matches.push({ team: matchingCsvTeam['TEAM NAME'], file: file.name, id: file.id });
        }
    }

    console.log(`Total Matches: ${matches.length}`);
    const uniqueTeams = new Set(matches.map(m => m.team.toLowerCase()));
    console.log(`Unique Teams: ${uniqueTeams.size}`);
    
    // Check for file ID collisions
    const idToTeams = new Map<string, string[]>();
    matches.forEach(m => {
        if(!idToTeams.has(m.id)) idToTeams.set(m.id, []);
        idToTeams.get(m.id)!.push(m.team);
    });

    for(const [id, teams] of idToTeams.entries()) {
        if(teams.length > 1) console.log(`Conflict: ID ${id} is shared by teams: ${teams.join(', ')}`);
    }
}
main();
