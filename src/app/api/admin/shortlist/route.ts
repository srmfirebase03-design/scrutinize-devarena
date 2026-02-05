import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const starredTeams = await prisma.team.findMany({
      where: { isStarred: true },
      orderBy: { score: 'desc' }, // Rank by score even if starred
      include: { evaluation: { include: { evaluator: true } } }
    })
    return NextResponse.json(starredTeams)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 })
  }
}
