import { prisma } from '@/lib/prisma'

async function clearReviews() {
  try {
    console.log('Starting review cleanup...')

    // 1. Delete all evaluations
    const deletedEvaluations = await prisma.evaluation.deleteMany({})
    console.log(`✓ Deleted ${deletedEvaluations.count} evaluations`)

    // 2. Reset all team reviews and stars
    const updatedTeams = await prisma.team.updateMany({
      data: {
        isStarred: false,
        comments: "",
      }
    })
    console.log(`✓ Reset ${updatedTeams.count} teams (cleared stars and comments)`)

    console.log('✅ Review cleanup complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error clearing reviews:', error)
    process.exit(1)
  }
}

clearReviews()
