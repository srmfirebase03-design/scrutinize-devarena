import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ name: team.teamName })
}
