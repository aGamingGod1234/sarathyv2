'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, UsersRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import TabBar from '@/components/ui/TabBar'

interface Circle {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export default function CirclesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/app/login'); return }
    setUserId(user.id)

    const { data: memberRows } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id)

    if (!memberRows?.length) { setLoading(false); return }

    const ids = (memberRows as Array<{ circle_id: string }>).map(r => r.circle_id)
    const { data } = await supabase
      .from('circles')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })

    setCircles((data || []) as Circle[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      if (!userId) throw new Error('Please sign in again.')
      const { data: circle, error: e } = await supabase
        .from('circles')
        .insert({ name: name.trim(), created_by: userId })
        .select()
        .single()
      if (e) throw e

      const { error: memberError } = await supabase.from('circle_members').insert({
        circle_id: circle.id,
        user_id: userId,
        display_name: 'You',
      })
      if (memberError) throw memberError

      setName(''); setShowCreate(false)
      load()
    } catch (err: any) {
      setError(err.message || 'Could not create circle')
    } finally { setSaving(false) }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/circles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toLowerCase() }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not join circle.')

      setInviteCode(''); setShowJoin(false)
      load()
    } catch (err: any) {
      setError(err.message || 'Could not join circle')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-dvh bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-dvh bg-cream px-5 pb-24 pt-12 md:pb-12 md:pl-32 md:pr-8 lg:pl-36">
      <main className="mx-auto w-full max-w-5xl">
      <div className="pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-fraunces text-2xl font-semibold text-ink">Circles</h1>
            <p className="text-ink-3 text-sm mt-0.5">Your private money community</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-white text-ink-3 shadow-sm">
              Join
            </button>
            <button onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-saffron text-white">
              + Create
            </button>
          </div>
        </div>
      </div>

      <div>
        {circles.length === 0 ? (
          <div className="card text-center py-10">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-plum/10 text-plum">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="font-fraunces text-lg font-semibold text-ink mb-2">
              No circles yet
            </p>
            <p className="text-ink-3 text-sm mb-6">
              Create a private circle with people you trust:
              partner, roommates, family, or an accountability buddy.
              Amounts are always blurred. Only money moments are shared.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(true)} className="btn-primary flex-1">
                Create a circle
              </button>
              <button onClick={() => setShowJoin(true)} className="btn-secondary flex-1">
                Join with code
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {circles.map(circle => (
              <button
                key={circle.id}
                onClick={() => router.push(`/app/circles/${circle.id}`)}
                className="card flex items-center justify-between active:opacity-70 text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-saffron-soft rounded-full flex items-center justify-center text-lg">
                    <UsersRound className="h-5 w-5 text-saffron" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{circle.name}</p>
                    <p className="text-ink-3 text-xs mt-0.5">
                      Code: <span className="font-mono font-semibold">{circle.invite_code}</span>
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create circle sheet */}
      {showCreate && (
        <>
          <div className="overlay" onClick={() => setShowCreate(false)} />
          <div className="bottom-sheet">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-fraunces text-xl font-semibold text-ink">Create a circle</h3>
              <button onClick={() => setShowCreate(false)} className="text-ink-3" aria-label="Close create circle sheet">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-ink-3 text-sm mb-4">
              Give it a name. You'll get an invite code to share with people you trust.
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Roommates, Partner, Family"
              className="input-field mb-4"
              autoFocus
            />
            {error && <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
            <button onClick={handleCreate} className="btn-primary" disabled={saving || !name.trim()}>
              {saving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create circle'}
            </button>
          </div>
        </>
      )}

      {/* Join circle sheet */}
      {showJoin && (
        <>
          <div className="overlay" onClick={() => setShowJoin(false)} />
          <div className="bottom-sheet">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-fraunces text-xl font-semibold text-ink">Join a circle</h3>
              <button onClick={() => setShowJoin(false)} className="text-ink-3" aria-label="Close join circle sheet">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-ink-3 text-sm mb-4">
              Enter the 16-character invite code someone shared with you.
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="e.g. a1b2c3d4e5f6a7b8"
              className="input-field mb-4 font-mono text-center text-lg tracking-widest"
              autoFocus
              maxLength={16}
            />
            {error && <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
            <button onClick={handleJoin} className="btn-primary" disabled={saving || !inviteCode.trim()}>
              {saving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Join circle'}
            </button>
          </div>
        </>
      )}
      </main>

      <TabBar active="circles" />
    </div>
  )
}
