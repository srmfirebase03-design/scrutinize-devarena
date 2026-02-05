
import { prisma } from '../src/lib/prisma';
import { listFiles } from '../src/lib/googleDrive';
import { getTeamsFromInternalCSV } from '../src/lib/teamSync';

const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';

async function sync() {
  const files = await listFiles(DRIVE_FOLDER_ID);
  const csvTeams = await getTeamsFromInternalCSV();
  
  const teamToFiles = new Map<string, string[]>();

  for (const file of files) {
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    let teamNameFromDrive = "";
    if (cleanName.includes('_')) teamNameFromDrive = cleanName.split('_').slice(1).join('_');
    else if (cleanName.includes(' - ')) teamNameFromDrive = cleanName.split(' - ').slice(1).join(' - ');
    else teamNameFromDrive = cleanName;
    
    teamNameFromDrive = teamNameFromDrive.replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "").trim().toLowerCase();

    const matchingCsvTeam = csvTeams.find(t => 
      t.teamName.toLowerCase().trim() === teamNameFromDrive
    );

    if (matchingCsvTeam) {
        const name = matchingCsvTeam.teamName;
        if(!teamToFiles.has(name)) teamToFiles.set(name, []);
        teamToFiles.get(name)!.push(file.name);
    }
  }

  console.log('Teams with multiple files:');
  for (const [name, fs] of teamToFiles.entries()) {
      if (fs.length > 1) console.log(`- ${name}: ${fs.join(', ')}`);
  }
}
sync().catch(console.error).finally(() => prisma.$disconnect());
