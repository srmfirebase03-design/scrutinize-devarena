
import { prisma } from '../src/lib/prisma';
import { listFiles } from '../src/lib/googleDrive';
import { getTeamsFromInternalCSV } from '../src/lib/teamSync';

const DRIVE_FOLDER_ID = '11DA6G9FuZuT6GUfGEaFxEVycks-vc5pR';

async function sync() {
  const files = await listFiles(DRIVE_FOLDER_ID);
  const csvTeams = await getTeamsFromInternalCSV();
  
  // Find the specific file and CSV entry
  const targetFile = files.find(f => f.name.includes('Non-Sync'));
  const targetCSV = csvTeams.find(t => t.email.includes('vijaykiran'));

  if (targetFile && targetCSV) {
      console.log('--- DEBUG MATCH ---');
      console.log(`File Name: "${targetFile.name}"`);
      
      const cleanName = targetFile.name.replace(/\.[^/.]+$/, "");
      let teamNameFromDrive = "";
      if (cleanName.includes('_')) teamNameFromDrive = cleanName.split('_').slice(1).join('_');
      
      const normDrive = teamNameFromDrive.replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "").toLowerCase().replace(/\s+/g, '');
      const normCSV = targetCSV.teamName.toLowerCase().replace(/\s+/g, '');

      console.log(`Drive Normalized: "${normDrive}"`);
      console.log(`CSV Normalized:   "${normCSV}"`);
      
      console.log(`Match? ${normDrive === normCSV}`);
      
      // Print character codes to find hidden diffs
      if (normDrive !== normCSV) {
          console.log('Drive Codes:', normDrive.split('').map(c => c.charCodeAt(0)));
          console.log('CSV Codes:  ', normCSV.split('').map((c: string) => c.charCodeAt(0)));
      }
  } else {
      console.log('Could not find both file and CSV entry for debugging.');
  }
}
sync().catch(console.error).finally(() => prisma.$disconnect());
