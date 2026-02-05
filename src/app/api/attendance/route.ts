import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { teamId } = await req.json()
    if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })

    await prisma.team.update({
      where: { id: teamId },
      data: {
        attendance: true,
        respondedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
