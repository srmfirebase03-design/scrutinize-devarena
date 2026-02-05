import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { teamId, comment, isStarred } = await req.json()

    // Validate input
    if (!teamId || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Transaction to update team and create evaluation
    try {
      await prisma.$transaction([
        // 1. Upsert evaluation (allows re-evaluation)
        prisma.evaluation.upsert({
          where: { teamId },
          update: {
            evaluatorId: session.user.id,
            comments: comment || "",
          },
          create: {
            teamId,
            evaluatorId: session.user.id,
            score: 0,
            comments: comment || "",
          }
        }),
        // 2. Update the Team
        prisma.team.update({
          where: { id: teamId },
          data: {
            comments: comment,
            isStarred: isStarred,
            status: "PENDING"
          }
        })
      ])
    } catch (txError: any) {
      console.error('Transaction Error:', txError)
      throw txError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Evaluation Error:', error)
    return NextResponse.json({
      error: error.message || 'Internal Server Error'
    }, { status: 500 })
  }
}
