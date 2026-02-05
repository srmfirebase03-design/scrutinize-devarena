import { NextResponse } from 'next/server'
import { listFiles } from '@/lib/googleDrive'
import { getTeamsFromInternalCSV } from '@/lib/teamSync'
import { prisma } from '@/lib/prisma'

import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { folderId } = await req.json()
    console.log('--- SYNC START ---')
    
    // 1. Get files from Drive
    const files = await listFiles(folderId)
    
    // 2. Read Internal CSV
    const csvTeams = await getTeamsFromInternalCSV()
    
    // 3. Process matches
    let createdCount = 0
    for (const file of files) {
      // ... matching logic ...
      const cleanName = file.name.replace(/\.[^/.]+$/, "")
      let teamNameFromDrive = ""
      let psNumberFromDrive = ""
      
      if (cleanName.includes('_')) {
        const parts = cleanName.split('_')
        psNumberFromDrive = parts[0].trim()
        teamNameFromDrive = parts.slice(1).join('_')
      } else if (cleanName.includes(' - ')) {
        const parts = cleanName.split(' - ')
        psNumberFromDrive = parts[0].trim()
        teamNameFromDrive = parts.slice(1).join(' - ')
      } else {
        teamNameFromDrive = cleanName
      }
      teamNameFromDrive = teamNameFromDrive.replace(/\(video\)|\(ppt\)|\(presentation\)/gi, "").trim()

      const matchingCsvTeam = csvTeams.find(t => 
        t.teamName.toLowerCase().trim() === teamNameFromDrive.toLowerCase().trim()
      )

      if (matchingCsvTeam) {
        await prisma.team.upsert({
          where: { driveFileId: file.id },
          update: {
            teamName: matchingCsvTeam.teamName,
            psNumber: psNumberFromDrive,
            email: matchingCsvTeam.email,
            fileType: file.mimeType?.includes('video') ? 'VIDEO' : 'PPT',
            folderName: file.folderName
          },
          create: {
            driveFileId: file.id,
            teamName: matchingCsvTeam.teamName,
            psNumber: psNumberFromDrive,
            email: matchingCsvTeam.email,
            fileType: file.mimeType?.includes('video') ? 'VIDEO' : 'PPT',
            folderName: file.folderName,
            status: 'PENDING'
          }
        })
        createdCount++
      }
    }

    // 4. IMPORTANT: REVALIDATE CACHE
    (revalidateTag as any)('teams');
    (revalidateTag as any)('queue');

    console.log(`Sync Finished. Created/Updated: ${createdCount}`)
    return NextResponse.json({ success: true, count: createdCount })
  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
