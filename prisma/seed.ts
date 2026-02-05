import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import 'dotenv/config'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  const users = [
    { username: 'admin', password: 'admin123', role: 'ADMIN' },
    { username: 'eval1', password: 'Pass123##$', role: 'EVALUATOR' },
    { username: 'eval2', password: 'Pass123##$', role: 'EVALUATOR' },
    { username: 'eval3', password: 'Pass123##$', role: 'EVALUATOR' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    })
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // With $extends, the disconnect is slightly different but usually handled
  })