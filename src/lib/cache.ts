import { prisma } from "./prisma"
import { unstable_cache } from "next/cache"

// 1. Cached Navbar Stats
export const getNavbarStats = unstable_cache(
  async (userId?: string) => {
    const totalTeams = await prisma.team.count()
    const totalStars = await prisma.team.count({ where: { isStarred: true } })
    
    const myStars = userId ? await prisma.team.count({ 
      where: { 
        isStarred: true,
        evaluation: { evaluatorId: userId }
      } 
    }) : 0

    return {
      totalTeams,
      totalStars,
      myStars,
      otherStars: totalStars - myStars
    }
  },
  ['navbar-stats'],
  { tags: ['teams', 'evaluations'], revalidate: 60 }
)

// 2. Cached Team Queue
export const getEvaluatorQueue = unstable_cache(
  async () => {
    // If folderName is causing issues, we fetch all and filter in memory
    const teams = await prisma.team.findMany({
      where: { status: "PENDING" },
      orderBy: { teamName: 'asc' }
    })
    return teams
  },
  ['evaluator-queue'],
  { tags: ['teams', 'queue'], revalidate: 30 }
)

// 3. Cached Admin Dashboard Data
export const getAdminStats = unstable_cache(
  async () => {
    return {
      total: await prisma.team.count(),
      approved: await prisma.team.count({ where: { status: "SELECTED" } }),
      rejected: await prisma.team.count({ where: { status: "REJECTED" } }),
      pending: await prisma.team.count({ where: { status: "PENDING" } }),
      attendance: await prisma.team.count({ where: { attendance: true } }),
    }
  },
  ['admin-stats'],
  { tags: ['teams', 'admin'], revalidate: 30 }
)