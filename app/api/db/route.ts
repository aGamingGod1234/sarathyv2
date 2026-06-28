import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Filter = {
  column: string
  op: 'eq' | 'in' | 'gte' | 'lt'
  value: unknown
}

type DbRequest = {
  table: keyof typeof delegates
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  values?: any
  filters?: Filter[]
  order?: { column: string; ascending?: boolean }
  limit?: number
  single?: boolean
  select?: string
  upsertOptions?: { onConflict?: string }
}

const delegates = {
  profiles: prisma.profile,
  budget_entries: prisma.budgetEntry,
  fixed_spending: prisma.fixedSpending,
  goals: prisma.goal,
  mood_logs: prisma.moodLog,
  chat_messages: prisma.chatMessage,
  remittance_logs: prisma.remittanceLog,
  waitlist: prisma.waitlistEntry,
  circles: prisma.circle,
  circle_members: prisma.circleMember,
  circle_moments: prisma.circleMoment,
}

const userOwnedTables = new Set<DbRequest['table']>([
  'budget_entries',
  'fixed_spending',
  'goals',
  'mood_logs',
  'chat_messages',
  'remittance_logs',
])

function json(data: unknown, error: string | null = null, status = 200) {
  return NextResponse.json({ data, error: error ? { message: error } : null }, { status })
}

function parseSelect(columns?: string) {
  if (!columns || columns.trim() === '*') return undefined
  const names = columns
    .split(',')
    .map(column => column.trim())
    .filter(Boolean)

  if (names.length === 0) return undefined
  return names.reduce<Record<string, boolean>>((select, column) => {
    select[column] = true
    return select
  }, {})
}

function buildWhere(filters: Filter[] = []) {
  const where: Record<string, any> = {}

  for (const filter of filters) {
    if (!filter.column) continue
    if (filter.op === 'eq') {
      where[filter.column] = filter.value
      continue
    }

    if (filter.op === 'in') {
      where[filter.column] = { in: Array.isArray(filter.value) ? filter.value : [] }
      continue
    }

    where[filter.column] = {
      ...(typeof where[filter.column] === 'object' && where[filter.column] !== null ? where[filter.column] : {}),
      [filter.op]: filter.value,
    }
  }

  return where
}

function normalizeValues(table: DbRequest['table'], values: any, userId: string | null) {
  const normalizeOne = (value: Record<string, any>) => {
    const next = { ...value }
    if (userId && userOwnedTables.has(table)) next.user_id = userId
    if (userId && table === 'profiles') next.id = userId
    if (userId && table === 'circles') next.created_by = userId
    if (userId && table === 'circle_members') next.user_id = userId
    if (userId && table === 'circle_moments') next.sender_id = next.sender_id || userId
    return next
  }

  return Array.isArray(values) ? values.map(normalizeOne) : normalizeOne(values || {})
}

async function assertCircleMembership(circleId: string | undefined, userId: string) {
  if (!circleId) return false
  const member = await prisma.circleMember.findFirst({
    where: { circle_id: circleId, user_id: userId },
    select: { id: true },
  })
  return Boolean(member)
}

async function applyAccessControl(table: DbRequest['table'], operation: DbRequest['operation'], where: Record<string, any>, userId: string | null) {
  if (table === 'waitlist' && operation === 'insert') return where
  if (!userId) throw new Error('Not authenticated')

  if (table === 'profiles') {
    return { ...where, id: userId }
  }

  if (userOwnedTables.has(table)) {
    return { ...where, user_id: userId }
  }

  if (table === 'circles') {
    if (operation === 'insert') return where
    if (where.invite_code) return where

    const idFilter = where.id
    const circleIds = Array.isArray(idFilter?.in)
      ? idFilter.in
      : typeof idFilter === 'string'
        ? [idFilter]
        : []

    if (circleIds.length > 0) {
      const memberships = await prisma.circleMember.findMany({
        where: { user_id: userId, circle_id: { in: circleIds } },
        select: { circle_id: true },
      })
      return { ...where, id: { in: memberships.map(member => member.circle_id) } }
    }
  }

  if (table === 'circle_members') {
    const circleId = typeof where.circle_id === 'string' ? where.circle_id : undefined
    if (operation === 'insert') return where
    if (where.user_id === userId) return where
    if (circleId && await assertCircleMembership(circleId, userId)) return where
    throw new Error('Not allowed')
  }

  if (table === 'circle_moments') {
    const circleId = typeof where.circle_id === 'string' ? where.circle_id : undefined
    if (circleId && await assertCircleMembership(circleId, userId)) return where
    if (operation === 'update') {
      const momentId = typeof where.id === 'string' ? where.id : undefined
      const moment = momentId
        ? await prisma.circleMoment.findUnique({ where: { id: momentId }, select: { circle_id: true } })
        : null
      if (moment && await assertCircleMembership(moment.circle_id, userId)) return where
    }
    throw new Error('Not allowed')
  }

  return where
}

function friendlyPrismaError(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return 'duplicate record'
    if (err.code === 'P2025') return 'record not found'
  }
  if (err instanceof Error) return err.message
  return 'Database request failed'
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as DbRequest
    const delegate = delegates[body.table] as any
    if (!delegate) return json(null, 'Unknown table', 400)

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    const rawWhere = buildWhere(body.filters || [])
    const where = await applyAccessControl(body.table, body.operation, rawWhere, userId)
    const select = parseSelect(body.select)
    const take = body.limit && body.limit > 0 ? body.limit : undefined
    const orderBy = body.order ? { [body.order.column]: body.order.ascending === false ? 'desc' : 'asc' } : undefined

    if (body.operation === 'select') {
      const args = { where, ...(select ? { select } : {}), ...(orderBy ? { orderBy } : {}), ...(take ? { take } : {}) }
      const data = body.single ? await delegate.findFirst(args) : await delegate.findMany(args)
      return json(data, body.single && !data ? 'No rows found' : null)
    }

    if (body.operation === 'insert') {
      const values = normalizeValues(body.table, body.values, userId)
      const data = Array.isArray(values)
        ? await Promise.all(values.map(value => delegate.create({ data: value })))
        : await delegate.create({ data: values })
      return json(data)
    }

    if (body.operation === 'update') {
      const values = normalizeValues(body.table, body.values, userId)
      const data = await delegate.updateMany({ where, data: values })
      return json(data)
    }

    if (body.operation === 'delete') {
      const data = await delegate.deleteMany({ where })
      return json(data)
    }

    if (body.operation === 'upsert') {
      const values = normalizeValues(body.table, body.values, userId) as Record<string, any>
      if (body.table === 'mood_logs') {
        const data = await prisma.moodLog.upsert({
          where: {
            user_id_entry_date: {
              user_id: values.user_id,
              entry_date: values.entry_date,
            },
          },
          update: values as any,
          create: values as any,
        })
        return json(data)
      }

      const existing = await delegate.findFirst({ where })
      const data = existing
        ? await delegate.update({ where: { id: existing.id }, data: values })
        : await delegate.create({ data: values })
      return json(data)
    }

    return json(null, 'Unsupported operation', 400)
  } catch (err) {
    console.error('DB route failed:', err)
    return json(null, friendlyPrismaError(err))
  }
}
