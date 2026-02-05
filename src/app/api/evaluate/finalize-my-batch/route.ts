import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail } from '@/lib/email'
import { getEvaluatorQueue } from "@/lib/cache"
import { Team } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Identify Evaluator's Folder (Aligned with Dashboard)
    const evaluatorUsername: string = session?.user?.name || 'eval1'
    
    // Helper to normalize
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase()

    // 2. Get Teams in Folder
    // Fetch all teams (or optimistically filter if possible, but safer to fetch all for this batch op)
    // Actually, fetching all teams might be heavy. Let's fetch by likely folder names or just all pending/selected.
    // Given the scale (hackathon), fetching all teams (likely < 500) is fine.
    const allTeams = await prisma.team.findMany()

    const folderTeams = allTeams.filter((t: Team) => {
       const folder = normalize(t.folderName || "")
       if (evaluatorUsername === "eval1") return folder === "ps1&ps2"
       if (evaluatorUsername === "eval2") return folder === "ps3ps4"
       if (evaluatorUsername === "eval3") return folder === "ps4"
       return false
    })

    if (folderTeams.length === 0) return NextResponse.json({ error: "No teams found for your folder assignment" }, { status: 400 })

    const selectedTeams = folderTeams.filter((t: Team) => t.isStarred)
    const rejectedTeams = folderTeams.filter((t: Team) => !t.isStarred)

    // ENFORCE 15
    if (selectedTeams.length !== 15) {
      return NextResponse.json({ error: `You must select exactly 15 teams. Currently selected: ${selectedTeams.length}` }, { status: 400 })
    }

    // 3. Batch Update Status
    await prisma.team.updateMany({
      where: { id: { in: selectedTeams.map((t: Team) => t.id) } },
      data: { status: "SELECTED" }
    })

    await prisma.team.updateMany({
      where: { id: { in: rejectedTeams.map((t: Team) => t.id) } },
      data: { status: "REJECTED" }
    })

    const sendBatchEmails = async () => {
      const emailPromises = []

      // 1. ACCEPTANCE (GREEN)
      for (const team of selectedTeams) {
        const subject = `🎉 Congratulations! Team ${team.teamName} Selected`
        const attendanceUrl = `${process.env.NEXTAUTH_URL}/attendance?teamId=${team.id}`
        const html = `
          <div style="background-color: #f0fdf4; padding: 40px 20px; font-family: sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #dcfce7;">
              <div style="background-color: #10b981; padding: 50px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em;">You're In!</h1>
                <p style="color: #ecfdf5; margin: 10px 0 0 0; font-weight: 500; font-size: 18px;">Team ${team.teamName} has been selected</p>
              </div>
              <div style="padding: 40px; background-color: #ffffff;">
                <p style="margin-top: 0; color: #064e3b; font-size: 16px;">Hi ${team.teamName},</p>
                <p style="color: #374151; font-size: 16px;">After a thorough review, our evaluators have chosen your team to advance to the next stage of <strong>scrutinize-devarena</strong>!</p>
                <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #bbf7d0;">
                  <h3 style="margin: 0 0 8px 0; color: #059669; text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 0.1em;">Reviewer Notes</h3>
                  <p style="margin: 0; color: #065f46; font-style: italic; font-size: 15px;">"${team.comments || 'Outstanding presentation.'}"</p>
                </div>
                <div style="text-align: center;">
                  <a href="${attendanceUrl}" style="background-color: #10b981; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 800; display: inline-block; font-size: 16px; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);">CONFIRM ATTENDANCE</a>
                </div>
              </div>
            </div>
          </div>
        `
        emailPromises.push(sendEmail(team.email, subject, html))
      }

      // 2. REJECTION (RED-ORANGE) - RE-ENABLED
      for (const team of rejectedTeams) {
        const subject = `Update regarding your submission: Team ${team.teamName}`
        const html = `
          <div style="background-color: #fffafb; padding: 40px 20px; font-family: sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #fee2e2;">
              <div style="background-color: #f97316; padding: 50px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Evaluation Update</h1>
                <p style="color: #ffedd5; margin: 10px 0 0 0; font-weight: 500;">Status for Team ${team.teamName}</p>
              </div>
              <div style="padding: 40px; background-color: #ffffff;">
                <p style="margin-top: 0; color: #431407; font-size: 16px;">Hello ${team.teamName},</p>
                <p style="color: #4b5563; font-size: 16px;">Thank you for your participation in <strong>scrutinize-devarena</strong>. Unfortunately, we are unable to move forward with your team for the final round at this time.</p>
                <div style="background-color: #fff7ed; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #ffedd5;">
                  <h3 style="margin: 0 0 8px 0; color: #c2410c; text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 0.1em;">Evaluator Feedback</h3>
                  <p style="margin: 0; color: #9a3412; font-style: italic; font-size: 15px;">"${team.comments || 'Thank you for your participation.'}"</p>
                </div>
                <p style="color: #6b7280; font-size: 15px;">We truly appreciate the time and passion you put into your project.</p>
              </div>
            </div>
          </div>
        `
        emailPromises.push(sendEmail(team.email, subject, html))
      }

      await Promise.allSettled(emailPromises)
    }

    await sendBatchEmails()
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Batch Error:", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
