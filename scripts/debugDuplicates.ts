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
    
    teamNameFromDrive = teamNameFromDrive.replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "").trim();

    const matchingCsvTeam = csvTeams.find(t => 
      t.teamName.toLowerCase().trim() === teamNameFromDrive.toLowerCase().trim()
    );

    if (matchingCsvTeam) {
      const name = matchingCsvTeam.teamName;
      if (!teamToFiles.has(name)) teamToFiles.set(name, []);
      teamToFiles.get(name)!.push(file.name);
    }
  }

  console.log('Duplicates found (Team Name mapped to multiple files):');
  let found = false;
  for (const [name, files] of teamToFiles.entries()) {
    if (files.length > 1) {
        console.log(`- ${name}: ${files.join(', ')}`);
        found = true;
    }
  }
  if (!found) console.log('No duplicates found.');
}
sync().catch(console.error);