
import { prisma } from '../src/lib/prisma';
import { listFiles } from '../src/lib/googleDrive';
import { getTeamsFromInternalCSV } from '../src/lib/teamSync';

const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';

async function sync() {
  const files = await listFiles(DRIVE_FOLDER_ID);
  const csvTeams = await getTeamsFromInternalCSV();
  
  const driveIdToTeamName = new Map<string, string>();
  const teamNameToDriveIds = new Map<string, string[]>();

  for (const file of files) {
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    let teamNameFromDrive = "";
    if (cleanName.includes('_')) teamNameFromDrive = cleanName.split('_').slice(1).join('_');
    else if (cleanName.includes(' - ')) teamNameFromDrive = cleanName.split(' - ').slice(1).join(' - ');
    else teamNameFromDrive = cleanName;
    
    teamNameFromDrive = teamNameFromDrive.replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "").trim();

    const matchingCsvTeam = csvTeams.find(t => 
      t.teamName.toLowerCase().trim() === teamNameFromDrive.toLowerCase().trim()
    );

    if (matchingCsvTeam) {
        const tName = matchingCsvTeam.teamName;
        driveIdToTeamName.set(file.id, tName);
        if (!teamNameToDriveIds.has(tName)) teamNameToDriveIds.set(tName, []);
        teamNameToDriveIds.get(tName)!.push(file.id);
    }
  }

  console.log('Unique Team Names found:', teamNameToDriveIds.size);
  console.log('Total Drive Files matched:', driveIdToTeamName.size);

  if (teamNameToDriveIds.size !== driveIdToTeamName.size) {
      console.log('\n[!] Conflict found: Multiple Drive Files mapped to the same Team Name:');
      for (const [name, ids] of teamNameToDriveIds.entries()) {
          if (ids.length > 1) {
              console.log(`- Team "${name}" is claimed by ${ids.length} files: ${ids.join(', ')}`);
          }
      }
  }
}
sync().catch(console.error).finally(() => prisma.$disconnect());
