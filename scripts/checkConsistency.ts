
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import 'dotenv/config';

// --- Configuration ---
const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';
const CSV_PATH = path.join(process.cwd(), 'public/data/hackathon.csv');

// --- Google Drive Setup ---
const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });

// --- Helper Functions ---

// 1. Fetch all files from Drive (recursive)
async function listFiles(folderId: string) {
    console.log('Fetching files from Google Drive...');
    const allFiles: any[] = [];
    const visited = new Set<string>();

    async function scanFolder(id: string, currentFolderName?: string) {
        if (visited.has(id)) return;
        visited.add(id);

        try {
            const res = await drive.files.list({
                q: `'${id}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType, shortcutDetails)',
                pageSize: 1000,
            });

            const files = res.data.files || [];
            for (const file of files) {
                let actualId = file.id!;
                let mimeType = file.mimeType!;

                if (mimeType === 'application/vnd.google-apps.shortcut' && file.shortcutDetails) {
                    actualId = file.shortcutDetails.targetId!;
                    mimeType = file.shortcutDetails.targetMimeType!;
                }

                if (mimeType === 'application/vnd.google-apps.folder') {
                    await scanFolder(actualId, (currentFolderName || file.name) ?? undefined);
                } else {
                    allFiles.push({ ...file, id: actualId, mimeType, folderName: currentFolderName });
                }
            }
        } catch (error: any) {
            console.error(`Error scanning folder ${id}:`, error.message);
        }
    }

    await scanFolder(folderId);
    console.log(`Found ${allFiles.length} total files in Drive.`);
    return allFiles;
}

// 2. Parse Drive Filename
function parseDriveFilename(fileName: string) {
    // Expected format: PSNumber_TeamName.ext or just TeamName.ext?
    // Based on teamSync.ts: "PSNumber_TeamName"
    
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const parts = nameWithoutExt.split('_');

    if (parts.length >= 2) {
        const psNumber = parts[0].trim();
        const teamName = parts.slice(1).join('_').trim();
        return { psNumber, teamName, original: fileName };
    }
    
    // Fallback: If no underscore, treat whole name as team name (or invalid)
    return { psNumber: null, teamName: nameWithoutExt.trim(), original: fileName };
}

// 3. Load CSV Data
function getCsvTeams() {
    console.log('Reading CSV...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    
    const teams = parsed.data
        .map((row: any) => {
            const name = row['TEAM NAME'];
            return name ? name.trim() : null;
        })
        .filter((name: string | null) => name !== null) as string[];

    console.log(`Found ${teams.length} teams in CSV.`);
    return teams;
}

// --- Main Execution ---
async function main() {
    // 1. Get Data
    const csvTeams = getCsvTeams(); // Array of team names
    const driveFiles = await listFiles(DRIVE_FOLDER_ID);

    // 2. Process Drive Data
    const driveTeamsMap = new Map<string, any>(); // Normalized TeamName -> FileData
    const driveFilesRaw = [];

    for (const file of driveFiles) {
        const parsed = parseDriveFilename(file.name);
        driveFilesRaw.push({ ...file, ...parsed });

        if (parsed.teamName) {
             // Simple normalization for matching: lowercase, remove extra spaces
             const normalizedKey = parsed.teamName.toLowerCase().replace(/\s+/g, '');
             driveTeamsMap.set(normalizedKey, { ...file, parsedName: parsed.teamName });
        }
    }

    // 3. Compare CSV vs Drive
    const missingInDrive: string[] = [];
    const foundTeams = new Set<string>(); // Use Set for unique team names

    for (const teamName of csvTeams) {
        const normalizedKey = teamName.toLowerCase().replace(/\s+/g, '');
        if (driveTeamsMap.has(normalizedKey)) {
            foundTeams.add(teamName);
        } else {
            missingInDrive.push(teamName);
        }
    }

    // 4. Report
    console.log('\n--- Consistency Check Report ---');
    console.log(`Total Teams in CSV: ${csvTeams.length}`);
    console.log(`Total Files in Drive: ${driveFiles.length}`);
    console.log(`Unique Matched Teams: ${foundTeams.size}`);
    
    if (missingInDrive.length > 0) {
        console.log(`\n[!] ${missingInDrive.length} Teams in CSV but MISSING in Drive (or name mismatch):`);
        missingInDrive.forEach(name => console.log(`  - ${name}`));
    } else {
        console.log('\n[OK] All CSV teams found in Drive.');
    }

    // Check for "orphaned" files in Drive (files that didn't match a CSV team)
    const unmatchedDriveFiles: string[] = [];
    const csvNormalizedSet = new Set(csvTeams.map(t => t.toLowerCase().replace(/\s+/g, '')));

    for (const [key, data] of driveTeamsMap.entries()) {
        if (!csvNormalizedSet.has(key)) {
            unmatchedDriveFiles.push(`${data.name} (Parsed: ${data.parsedName})`);
        }
    }

    if (unmatchedDriveFiles.length > 0) {
        console.log(`\n[!] ${unmatchedDriveFiles.length} Files in Drive that do NOT match any CSV team:`);
        unmatchedDriveFiles.forEach(info => console.log(`  - ${info}`));
    }
}

main().catch(console.error);
