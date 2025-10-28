import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma

export const sql = (() => {
  throw new Error('Raw SQL queries are not supported with SQLite. Please use Prisma client instead.')
}) as any
