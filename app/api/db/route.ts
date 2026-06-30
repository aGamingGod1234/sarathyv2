import crypto from 'crypto'
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

const MAX_PERSONAL_MONEY_AMOUNT = 10_000_000
const BLOCKED_PROFILE_WRITE_FIELDS = ['plan_tier', 'created_at', 'updated_at'] as const
const CIRCLE_MEMBER_UPDATE_FIELDS = new Set(['display_name'])
const COLUMN_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

const scalarFields: Record<DbRequest['table'], Set<string>> = {
  profiles: new Set([
    'id',
    'name',
    'home_country',
    'current_country',
    'user_types',
    'primary_currency',
    'language_preference',
    'planning_amount',
    'total_money',
    'money_type',
    'responsible_for',
    'money_fear',
    'income_timing',
    'companion_vibe',
    'plan_tier',
    'daily_login_streak',
    'last_login_date',
    'total_xp',
    'level',
    'achievements',
    'onboarding_complete',
    'colour_theme',
    'quiet_mode_until',
    'created_at',
    'updated_at',
  ]),
  budget_entries: new Set([
    'id',
    'user_id',
    'category',
    'amount',
    'original_amount',
    'original_currency',
    'description',
    'entry_date',
    'payment_method',
    'logged_via',
    'created_at',
  ]),
  fixed_spending: new Set([
    'id',
    'user_id',
    'name',
    'emoji',
    'amount',
    'frequency',
    'due_day',
    'is_active',
    'created_at',
  ]),
  goals: new Set([
    'id',
    'user_id',
    'name',
    'emoji',
    'target_amount',
    'current_amount',
    'deadline',
    'user_caption',
    'created_at',
  ]),
  mood_logs: new Set(['id', 'user_id', 'mood', 'entry_date', 'created_at']),
  chat_messages: new Set(['id', 'user_id', 'role', 'content', 'created_at']),
  remittance_logs: new Set([
    'id',
    'user_id',
    'amount',
    'provider',
    'rate',
    'fee',
    'recipient_gets',
    'source_currency',
    'destination_currency',
    'created_at',
  ]),
  waitlist: new Set([
    'id',
    'name',
    'email',
    'user_type',
    'country_from',
    'country_now',
    'sends_money_home',
    'money_stress',
    'current_tool',
    'biggest_pain',
    'feature_excited',
    'wants_beta',
    'referral',
    'created_at',
  ]),
  circles: new Set(['id', 'name', 'invite_code', 'created_by', 'created_at']),
  circle_members: new Set(['id', 'circle_id', 'user_id', 'display_name', 'created_at']),
  circle_moments: new Set(['id', 'circle_id', 'sender_id', 'type', 'content', 'reactions', 'created_at']),
}

class DbRequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
    this.name = 'DbRequestError'
  }
}

function json(data: unknown, error: string | null = null, status = 200) {
  return NextResponse.json({ data, error: error ? { message: error } : null }, { status })
}

function assertAllowedColumn(table: DbRequest['table'], column: string, label: string) {
  if (!COLUMN_NAME_PATTERN.test(column) || !scalarFields[table].has(column)) {
    throw new DbRequestError(`Invalid ${label}.`, 400)
  }
}

function parseSelect(table: DbRequest['table'], columns?: string) {
  if (!columns || columns.trim() === '*') return undefined
  const names = columns
    .split(',')
    .map(column => column.trim())
    .filter(Boolean)

  if (names.length === 0) return undefined
  return names.reduce<Record<string, boolean>>((select, column) => {
    assertAllowedColumn(table, column, 'select column')
    select[column] = true
    return select
  }, {})
}

function buildWhere(table: DbRequest['table'], filters: Filter[] = []) {
  const where: Record<string, any> = {}

  for (const filter of filters) {
    if (!filter.column) continue
    assertAllowedColumn(table, filter.column, 'filter column')
    if (filter.op === 'eq') {
      where[filter.column] = filter.value
      continue
    }

    if (filter.op === 'in') {
      where[filter.column] = { in: Array.isArray(filter.value) ? filter.value : [] }
      continue
    }

    if (filter.op !== 'gte' && filter.op !== 'lt') {
      throw new DbRequestError('Invalid filter operator.', 400)
    }

    where[filter.column] = {
      ...(typeof where[filter.column] === 'object' && where[filter.column] !== null ? where[filter.column] : {}),
      [filter.op]: filter.value,
    }
  }

  return where
}

function sanitizeOrder(table: DbRequest['table'], order?: DbRequest['order']) {
  if (!order) return undefined
  assertAllowedColumn(table, order.column, 'order column')
  return { [order.column]: order.ascending === false ? 'desc' : 'asc' }
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase())
}

function normalizeValues(
  table: DbRequest['table'],
  values: any,
  userId: string | null,
  operation: DbRequest['operation'],
) {
  const generateInviteCode = () => crypto.randomBytes(8).toString('hex')

  const normalizeMoney = (raw: unknown, label: string, options: { allowZero?: boolean; nullable?: boolean } = {}) => {
    if ((raw === null || raw === undefined || raw === '') && options.nullable) return null
    const value = Number(raw)
    if (!Number.isFinite(value)) throw new DbRequestError(`${label} must be a valid number.`)
    if (options.allowZero ? value < 0 : value <= 0) {
      throw new DbRequestError(`${label} must be ${options.allowZero ? '0 or more' : 'greater than 0'}.`)
    }
    if (value > MAX_PERSONAL_MONEY_AMOUNT) {
      throw new DbRequestError(`${label} is too high for a personal budget. Enter a value below ${MAX_PERSONAL_MONEY_AMOUNT.toLocaleString('en-SG')}.`)
    }
    return Math.round(value * 100) / 100
  }

  const validateOne = (value: Record<string, any>) => {
    if (table === 'profiles') {
      for (const field of BLOCKED_PROFILE_WRITE_FIELDS) {
        if (field in value) {
          throw new DbRequestError(
            field === 'plan_tier'
              ? 'Plan changes must go through billing.'
              : 'This profile field cannot be changed here.',
            403,
          )
        }
      }
      if ('planning_amount' in value) {
        value.planning_amount = normalizeMoney(value.planning_amount, 'Monthly budget or income', { allowZero: true, nullable: true })
      }
      if ('total_money' in value) {
        value.total_money = normalizeMoney(value.total_money, 'Total money', { allowZero: true, nullable: true })
      }
    }

    if (table === 'waitlist') {
      value.email = String(value.email || '').trim().toLowerCase()
      value.name = String(value.name || '').trim()
      if (!value.name) throw new DbRequestError('Enter your name.')
      if (!isValidEmail(value.email)) throw new DbRequestError('Enter a valid email address.')
    }

    if (table === 'circle_members' && operation === 'update') {
      const fields = Object.keys(value)
      if (fields.some(field => !CIRCLE_MEMBER_UPDATE_FIELDS.has(field))) {
        throw new DbRequestError('Not allowed.', 403)
      }
    }

    if (table === 'budget_entries') {
      if ('amount' in value) value.amount = normalizeMoney(value.amount, 'Expense amount')
      if ('original_amount' in value && value.original_amount !== null && value.original_amount !== undefined) {
        value.original_amount = normalizeMoney(value.original_amount, 'Original expense amount')
      }
    }

    if (table === 'fixed_spending') {
      if ('amount' in value) value.amount = normalizeMoney(value.amount, 'Fixed cost amount')
      if ('due_day' in value && value.due_day !== null && value.due_day !== undefined && value.due_day !== '') {
        const dueDay = Number(value.due_day)
        if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
          throw new DbRequestError('Due day must be between 1 and 31.')
        }
        value.due_day = dueDay
      }
    }

    return value
  }

  const normalizeOne = (value: Record<string, any>) => {
    const next = { ...value }
    if (userId && userOwnedTables.has(table)) next.user_id = userId
    if (userId && table === 'profiles') next.id = userId
    if (userId && table === 'circles' && operation === 'insert') {
      next.created_by = userId
      next.invite_code = generateInviteCode()
    }
    if (userId && table === 'circle_members' && operation === 'insert') next.user_id = userId
    if (userId && table === 'circle_moments' && operation === 'insert') next.sender_id = userId
    return validateOne(next)
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

function circleIdsFromValues(values: unknown) {
  const rows = Array.isArray(values) ? values : [values]
  return Array.from(new Set(
    rows
      .map(value => typeof value === 'object' && value !== null ? (value as Record<string, unknown>).circle_id : undefined)
      .filter((circleId): circleId is string => typeof circleId === 'string' && circleId.length > 0),
  ))
}

function rowsFromValues(values: unknown) {
  return Array.isArray(values) ? values : [values]
}

function rowsMissingCircleId(values: unknown) {
  return rowsFromValues(values).some(value => (
    !value
    || typeof value !== 'object'
    || typeof (value as Record<string, unknown>).circle_id !== 'string'
    || !(value as Record<string, string>).circle_id
  ))
}

async function assertAllCircleMemberships(circleIds: string[], userId: string) {
  if (circleIds.length === 0) return false
  const memberships = await prisma.circleMember.findMany({
    where: { user_id: userId, circle_id: { in: circleIds } },
    select: { circle_id: true },
  })
  const joined = new Set(memberships.map(member => member.circle_id))
  return circleIds.every(circleId => joined.has(circleId))
}

async function memberCircleWhere(userId: string) {
  const memberships = await prisma.circleMember.findMany({
    where: { user_id: userId },
    select: { circle_id: true },
  })
  return { id: { in: memberships.map(member => member.circle_id) } }
}

async function creatorOrMemberCircleIds(circleIds: string[], userId: string) {
  if (circleIds.length === 0) return []
  const [owned, memberships] = await Promise.all([
    prisma.circle.findMany({
      where: { id: { in: circleIds }, created_by: userId },
      select: { id: true },
    }),
    prisma.circleMember.findMany({
      where: { circle_id: { in: circleIds }, user_id: userId },
      select: { circle_id: true },
    }),
  ])
  return Array.from(new Set([
    ...owned.map(circle => circle.id),
    ...memberships.map(member => member.circle_id),
  ]))
}

async function ownedCircleIds(circleIds: string[], userId: string) {
  if (circleIds.length === 0) return []
  const circles = await prisma.circle.findMany({
    where: { id: { in: circleIds }, created_by: userId },
    select: { id: true },
  })
  return circles.map(circle => circle.id)
}

function requestedFields(values: unknown) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return []
  return Object.keys(values as Record<string, unknown>)
}

async function applyAccessControl(
  table: DbRequest['table'],
  operation: DbRequest['operation'],
  where: Record<string, any>,
  userId: string | null,
  values?: unknown,
) {
  if (table === 'waitlist') {
    if (operation === 'insert') return where
    throw new DbRequestError('Not allowed.', 403)
  }
  if (!userId) throw new DbRequestError('Sign in required.', 401)

  if (table === 'profiles') {
    return { ...where, id: userId }
  }

  if (userOwnedTables.has(table)) {
    return { ...where, user_id: userId }
  }

  if (table === 'circles') {
    if (operation === 'insert') return where
    if (where.invite_code) {
      throw new DbRequestError('Not allowed.', 403)
    }

    const idFilter = where.id
    const circleIds = Array.isArray(idFilter?.in)
      ? idFilter.in
      : typeof idFilter === 'string'
        ? [idFilter]
        : []

    if (operation === 'select') {
      if (circleIds.length > 0) {
        const memberships = await prisma.circleMember.findMany({
          where: { user_id: userId, circle_id: { in: circleIds } },
          select: { circle_id: true },
        })
        return { ...where, id: { in: memberships.map(member => member.circle_id) } }
      }
      return { ...where, ...await memberCircleWhere(userId) }
    }

    if (operation === 'update' || operation === 'delete') {
      if (circleIds.length === 0) throw new DbRequestError('Circle id required.', 400)
      return { ...where, created_by: userId, id: { in: await ownedCircleIds(circleIds, userId) } }
    }

    throw new DbRequestError('Not allowed.', 403)
  }

  if (table === 'circle_members') {
    const circleId = typeof where.circle_id === 'string' ? where.circle_id : undefined
    if (operation === 'insert') {
      if (rowsMissingCircleId(values)) throw new DbRequestError('Circle id required.', 400)
      const requestedIds = circleIdsFromValues(values)
      const allowedIds = new Set(await creatorOrMemberCircleIds(requestedIds, userId))
      if (requestedIds.some(id => !allowedIds.has(id))) throw new DbRequestError('Not allowed.', 403)
      return where
    }

    if (operation === 'select' && where.user_id === userId) return where
    if (operation === 'select' && circleId && await assertCircleMembership(circleId, userId)) return where
    if (operation === 'update') {
      if (where.user_id === userId) return { ...where, user_id: userId }
      throw new DbRequestError('Not allowed.', 403)
    }
    if (operation === 'delete' && where.user_id === userId) return where
    if (operation === 'delete' && circleId) {
      const owner = await prisma.circle.findFirst({
        where: { id: circleId, created_by: userId },
        select: { id: true },
      })
      if (owner) return where
    }
    throw new DbRequestError('Not allowed.', 403)
  }

  if (table === 'circle_moments') {
    const circleId = typeof where.circle_id === 'string' ? where.circle_id : undefined
    if (operation === 'insert' && await assertAllCircleMemberships(circleIdsFromValues(values), userId)) return where
    if (operation === 'update') {
      const fields = requestedFields(values)
      if (fields.some(field => field !== 'reactions')) throw new DbRequestError('Not allowed.', 403)
      const momentId = typeof where.id === 'string' ? where.id : undefined
      if (!momentId) throw new DbRequestError('Moment id required.', 400)
      const moment = momentId
        ? await prisma.circleMoment.findUnique({ where: { id: momentId }, select: { circle_id: true } })
        : null
      if (moment && await assertCircleMembership(moment.circle_id, userId)) return where
    }
    if (operation === 'delete') return { ...where, sender_id: userId }
    if (operation === 'select' && circleId && await assertCircleMembership(circleId, userId)) return where
    throw new DbRequestError('Not allowed.', 403)
  }

  return where
}

function friendlyDbError(err: unknown) {
  if (err instanceof DbRequestError) {
    return { message: err.message, status: err.status }
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return { message: 'Duplicate record.', status: 409 }
    if (err.code === 'P2025') return { message: 'Record not found.', status: 404 }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { message: 'Invalid database request.', status: 400 }
  }

  return { message: 'Database request failed.', status: 500 }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as DbRequest
    const delegate = delegates[body.table] as any
    if (!delegate) return json(null, 'Unknown table', 400)

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    const rawWhere = buildWhere(body.table, body.filters || [])
    const where = await applyAccessControl(body.table, body.operation, rawWhere, userId, body.values)
    const select = parseSelect(body.table, body.select)
    const take = body.limit && body.limit > 0 ? body.limit : undefined
    const orderBy = sanitizeOrder(body.table, body.order)

    if (body.operation === 'select') {
      const args = { where, ...(select ? { select } : {}), ...(orderBy ? { orderBy } : {}), ...(take ? { take } : {}) }
      const data = body.single ? await delegate.findFirst(args) : await delegate.findMany(args)
      return json(data, body.single && !data ? 'No rows found' : null)
    }

    if (body.operation === 'insert') {
      const values = normalizeValues(body.table, body.values, userId, body.operation)
      const data = Array.isArray(values)
        ? await Promise.all(values.map(value => delegate.create({ data: value })))
        : await delegate.create({ data: values })
      return json(data)
    }

    if (body.operation === 'update') {
      const values = normalizeValues(body.table, body.values, userId, body.operation)
      const data = await delegate.updateMany({ where, data: values })
      return json(data)
    }

    if (body.operation === 'delete') {
      const data = await delegate.deleteMany({ where })
      return json(data)
    }

    if (body.operation === 'upsert') {
      const values = normalizeValues(body.table, body.values, userId, body.operation) as Record<string, any>
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
    const friendly = friendlyDbError(err)
    return json(null, friendly.message, friendly.status)
  }
}
