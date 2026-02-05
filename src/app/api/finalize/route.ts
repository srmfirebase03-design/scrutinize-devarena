import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    // 1. Get ALL teams
    const allTeams = await prisma.team.findMany({
      select: { id: true, teamName: true, email: true, isStarred: true, score: true }
    })

    // 2. Segment by Star Status
    // The "Selected" teams are purely those that were STARRED.
    const selectedTeams = allTeams.filter((t: { isStarred: boolean }) => t.isStarred)
    const rejectedTeams = allTeams.filter((t: { isStarred: boolean }) => !t.isStarred)

    if (selectedTeams.length === 0) {
      return NextResponse.json({ error: "No teams have been starred for selection." }, { status: 400 })
    }

    // 3. Batch Update DB Status
    // Mark Starred as SELECTED
    await prisma.team.updateMany({
      where: { id: { in: selectedTeams.map((t: { id: string }) => t.id) } },
      data: { status: "SELECTED" }
    })

    // Mark others as REJECTED
    await prisma.team.updateMany({
      where: { id: { in: rejectedTeams.map((t: { id: string }) => t.id) } },
      data: { status: "REJECTED" }
    })

    // 4. Send Emails
    const sendBatchEmails = async () => {
      console.log(`Starting batch email for ${allTeams.length} teams...`)
      const emailPromises = []
      
      // Send Acceptance Emails
      for (const team of selectedTeams) {
        const subject = `🎉 Congratulations! Team ${team.teamName} Selected`
        const attendanceUrl = `${process.env.NEXTAUTH_URL}/attendance?teamId=${team.id}`
        const html = `
          <div style="font-family: Arial, color: #333;">
            <h1 style="color: #16a34a;">Congratulations!</h1>
            <p>Team <strong>${team.teamName}</strong> has been selected for the next round.</p>
            <p>Please confirm your physical attendance by clicking the button below:</p>
            <a href="${attendanceUrl}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">CONFIRM ATTENDANCE</a>
          </div>
        `
        emailPromises.push(sendEmail(team.email, subject, html))
      }

      // Send Rejection Emails
      for (const team of rejectedTeams) {
        const subject = `Update on your submission - Team ${team.teamName}`
        const html = `
          <div style="font-family: Arial, color: #333;">
            <h2>Hello Team ${team.teamName},</h2>
            <p>Thank you for participating. Unfortunately, you were not selected for the top 40 this time.</p>
          </div>
        `
        emailPromises.push(sendEmail(team.email, subject, html))
      }
      
      await Promise.allSettled(emailPromises)
      console.log("Batch emails completed.")
    }

    await sendBatchEmails()

    return NextResponse.json({ 
      success: true, 
      selected: selectedTeams.length, 
      rejected: rejectedTeams.length 
    })

  } catch (error) {
    console.error("Finalize Error:", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}