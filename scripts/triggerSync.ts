
import { prisma } from '../src/lib/prisma';
import { listFiles } from '../src/lib/googleDrive';
import { getTeamsFromInternalCSV } from '../src/lib/teamSync';

const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';

async function sync() {
  console.log('--- RESETTING DATABASE ---');
  await prisma.team.deleteMany();
  console.log('Database cleared.\n');

  console.log('Fetching files from Drive...');
  const files = await listFiles(DRIVE_FOLDER_ID);
  const csvTeams = await getTeamsFromInternalCSV();
  
  console.log(`Total files found in Drive: ${files.length}`);
  console.log(`Total teams in CSV: ${csvTeams.length}`);

  const seenFileIds = new Set<string>();
  const addedTeamNames = new Set<string>();
  let successCount = 0;

  for (const file of files) {
    if (seenFileIds.has(file.id)) {
        console.log(`[SKIP] Duplicate File ID: ${file.id} (${file.name})`);
        continue;
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    let teamNameFromDrive = "";
    let psNumberFromDrive = "";
    
    if (cleanName.includes('_')) {
      const parts = cleanName.split('_');
      psNumberFromDrive = parts[0].trim();
      teamNameFromDrive = parts.slice(1).join('_');
    } else if (cleanName.includes(' - ')) {
      const parts = cleanName.split(' - ');
      psNumberFromDrive = parts[0].trim();
      teamNameFromDrive = parts.slice(1).join(' - ');
    } else {
      teamNameFromDrive = cleanName;
    }
    
    const normalizedDriveName = teamNameFromDrive
        .replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "")
        .toLowerCase()
        .replace(/\s+/g, '');

    const matchingCsvTeam = csvTeams.find(t => 
      t.teamName.toLowerCase().replace(/\s+/g, '') === normalizedDriveName
    );

    if (matchingCsvTeam) {
        try {
            await prisma.team.create({
                data: {
                    driveFileId: file.id,
                    teamName: matchingCsvTeam.teamName,
                    psNumber: psNumberFromDrive,
                    email: matchingCsvTeam.email,
                    fileType: file.mimeType?.includes('video') ? 'VIDEO' : 'PPT',
                    folderName: file.folderName,
                    status: 'PENDING'
                }
            });
            seenFileIds.add(file.id);
            addedTeamNames.add(matchingCsvTeam.teamName);
            successCount++;
            
            if (matchingCsvTeam.teamName.includes('Non-Sync')) {
                console.log(`[OK] Successfully added Non-Sync Coderz!`);
            }
        } catch (e: any) {
            console.error(`[ERROR] FAILED to add ${matchingCsvTeam.teamName}:`, e.message);
        }
    } else {
        // Log skipped files except known ones
        if (!file.name.includes('(Demo)') && !normalizedDriveName.includes('codecrafters') && !normalizedDriveName.includes('codewave')) {
            console.log(`[UNMATCHED] File: "${file.name}" | Normalized: "${normalizedDriveName}"`);
        }
    }
  }
  
  const finalCount = await prisma.team.count();
  console.log(`\n--- SYNC COMPLETE ---`);
  console.log(`Total Unique Teams in DB: ${finalCount}`);
  
  if (finalCount === 98) {
      console.log('SUCCESS: Target of 98 teams reached!');
  } else {
      console.log(`NOTE: Final count is ${finalCount}. One team might still be missing.`);
  }
}

sync().catch(console.error).finally(() => prisma.$disconnect());
