import { getSession, signIn, signOut } from 'next-auth/react'

type Filter = {
  column: string
  op: 'eq' | 'in' | 'gte' | 'lt'
  value: unknown
}

type DbResponse<T = any> = {
  data: T | null
  error: { message: string } | null
}

class QueryBuilder<T = any> implements PromiseLike<DbResponse<T>> {
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private values: any
  private filters: Filter[] = []
  private selected = '*'
  private orderBy: { column: string; ascending?: boolean } | undefined
  private limitCount: number | undefined
  private wantsSingle = false
  private upsertOptions: { onConflict?: string } | undefined

  constructor(private table: string) {}

  select(columns = '*') {
    this.operation = this.operation === 'insert' ? 'insert' : 'select'
    this.selected = columns
    return this
  }

  insert(values: any) {
    this.operation = 'insert'
    this.values = values
    return this
  }

  update(values: any) {
    this.operation = 'update'
    this.values = values
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.operation = 'upsert'
    this.values = values
    this.upsertOptions = options
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: 'eq', value })
    return this
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, op: 'in', value })
    return this
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, op: 'gte', value })
    return this
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, op: 'lt', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.wantsSingle = true
    return this.execute()
  }

  async execute(): Promise<DbResponse<T>> {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          operation: this.operation,
          values: this.values,
          filters: this.filters,
          order: this.orderBy,
          limit: this.limitCount,
          single: this.wantsSingle,
          select: this.selected,
          upsertOptions: this.upsertOptions,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        return { data: null, error: { message: payload?.error?.message || 'Request failed' } }
      }
      return payload
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Request failed' },
      }
    }
  }

  then<TResult1 = DbResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DbResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createClient() {
  return {
    auth: {
      async getUser() {
        const session = await getSession()
        return {
          data: {
            user: session?.user
              ? {
                  id: session.user.id,
                  email: session.user.email,
                  user_metadata: { name: session.user.name },
                }
              : null,
          },
          error: null,
        }
      },
      async getSession() {
        const session = await getSession()
        return { data: { session }, error: null }
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        })
        return {
          data: result?.ok ? { user: result } : null,
          error: result?.error ? { message: 'Invalid email or password.' } : null,
        }
      },
      async signUp({ email, password }: { email: string; password: string }) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const payload = await res.json()
        if (!res.ok) {
          return { data: null, error: { message: payload?.error || 'Could not create account.' } }
        }
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        })
        return {
          data: result?.ok ? { user: payload.user } : null,
          error: result?.error ? { message: 'Account created, but sign-in failed.' } : null,
        }
      },
      async signOut() {
        await signOut({ redirect: false })
        return { error: null }
      },
    },
    from<T = any>(table: string) {
      return new QueryBuilder<T>(table)
    },
  }
}
