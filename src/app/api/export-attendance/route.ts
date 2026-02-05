import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const attendees = await prisma.team.findMany({
    where: { attendance: true },
    select: { teamName: true, email: true, score: true }
  })

  const csvRows = [
    ["Team Name", "Email", "Score"],
    ...attendees.map((t: { teamName: string; email: string; score: number | null }) => [t.teamName, t.email, t.score || 0])
  ]

  const csvContent = csvRows.map(e => e.join(",")).join("\n")

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="confirmed_attendance.csv"',
    },
  })
}