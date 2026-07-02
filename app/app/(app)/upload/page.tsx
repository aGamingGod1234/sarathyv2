'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/calculations'
import { detectNumericDateOrder, formatDateKey, getLocalDateKey, normalizeDateKey } from '@/lib/dates'
import type { DateOrder } from '@/lib/dates'
import TabBar from '@/components/ui/TabBar'

const CATEGORIES = ['Food','Transport','Social','Home','Family','Shopping','Health','Education','Entertainment','Other']
const MONTH_FIRST_CURRENCIES = new Set(['USD'])

interface Tx { date:string; description:string; amount:number; category:string; selected:boolean }
type ParsedTx = Pick<Tx, 'date' | 'description' | 'amount'>

function parseCsvRow(line: string, delimiter = ',') {
  const cols: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === delimiter && !inQuotes) {
      cols.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cols.push(current.trim())
  return cols
}

function parseSignedMoneyCell(value?: string) {
  const rawValue = value?.trim()
  if (!rawValue) return null
  const signNormalized = rawValue.replace(/\u2212/g, '-')
  const hasDebitMarker = /\b(dr|debit)\b/i.test(signNormalized)
  const isNegative = /^\(.*\)$/.test(signNormalized) || /-\s*$/.test(signNormalized) || hasDebitMarker
  const normalized = signNormalized
    .replace(/\u2212/g, '-')
    .replace(/^\((.*)\)$/, '$1')
    .replace(/-\s*$/, '')
    .replace(/[^\d.()+-]/g, '')
  const parsedAmount = Number.parseFloat(normalized)
  const amount = isNegative ? -Math.abs(parsedAmount) : parsedAmount
  if (!Number.isFinite(amount) || amount === 0) return null
  return amount
}

function normalizeHeader(value?: string) {
  return value?.replace(/^\uFEFF/, '').trim().toLowerCase() || ''
}

function countDelimitedColumns(line: string, delimiter: string) {
  return parseCsvRow(line, delimiter).length
}

function detectDelimiter(lines: string[]) {
  const delimiters = [',', ';', '\t']
  return delimiters
    .map(delimiter => ({
      delimiter,
      score: lines.slice(0, 10).reduce((sum, line) => sum + Math.max(0, countDelimitedColumns(line, delimiter) - 1), 0),
    }))
    .sort((a, b) => b.score - a.score)[0]?.delimiter || ','
}

function findHeaderRow(lines: string[], delimiter: string) {
  const maxHeaderScan = Math.min(lines.length, 25)
  let widestRowIndex = 0
  let widestRowLength = 0

  for (let i = 0; i < maxHeaderScan; i++) {
    const headers = parseCsvRow(lines[i], delimiter).map(normalizeHeader)
    const dateLike = headers.some(isDateHeader)
    const descriptionLike = headers.some(header => headerMatches(header, [/description/, /merchant/, /payee/, /narration/, /details/, /transaction/]))
    const amountLike = headers.some(header => headerMatches(header, [/amount/, /debit/, /credit/, /withdraw/, /deposit/, /paid out/, /money in/, /money out/, /value/]))

    if (headers.length > widestRowLength) {
      widestRowIndex = i
      widestRowLength = headers.length
    }

    if (headers.length >= 2 && dateLike && (descriptionLike || amountLike)) return i
  }

  return widestRowIndex
}

function looksLikeDateCell(value?: string) {
  return !!normalizeDateKey(value || '', 'day-first') || !!normalizeDateKey(value || '', 'month-first')
}

function chooseFallbackIndex(cols: string[], preferredIndex: number, usedIndices: number[], predicate: (value?: string) => boolean) {
  if (predicate(cols[preferredIndex])) return preferredIndex
  const index = cols.findIndex((value, candidateIndex) => !usedIndices.includes(candidateIndex) && predicate(value))
  return index >= 0 ? index : preferredIndex
}

function headerMatches(header: string, patterns: RegExp[]) {
  return patterns.some(pattern => pattern.test(header))
}

function findHeaderIndex(headers: string[], patterns: RegExp[]) {
  const index = headers.findIndex(header => headerMatches(header, patterns))
  return index >= 0 ? index : null
}

function findHeaderIndices(headers: string[], patterns: RegExp[]) {
  return headers
    .map((header, index) => headerMatches(header, patterns) ? index : -1)
    .filter(index => index >= 0)
}

function isDirectionHeader(header: string) {
  return /^(type|transaction type|direction|debit\s*\/\s*credit|credit\s*\/\s*debit|debit or credit|credit or debit|dr\s*\/\s*cr|cr\s*\/\s*dr)$/.test(header)
}

function isDateHeader(header: string) {
  return /\b(date|posted)\b/.test(header)
}

function getStatementDateFallbackOrder(currency: string): DateOrder {
  return MONTH_FIRST_CURRENCIES.has(currency) ? 'month-first' : 'day-first'
}

function statementHasMixedSignedAmounts(lines: string[], amountIndices: number[], delimiter = ',') {
  let hasPositiveAmount = false
  let hasNegativeAmount = false

  for (const line of lines) {
    const cols = parseCsvRow(line, delimiter)
    for (const index of amountIndices) {
      const amount = parseSignedMoneyCell(cols[index])
      if (amount === null) continue
      if (amount > 0) hasPositiveAmount = true
      if (amount < 0) hasNegativeAmount = true
      if (hasPositiveAmount && hasNegativeAmount) return true
    }
  }

  return false
}

function getExpenseAmount(
  cols: string[],
  debitIndices: number[],
  creditIndices: number[],
  amountIndices: number[],
  typeIndex: number | null,
  allowPositiveAmountFallback: boolean,
) {
  for (const index of debitIndices) {
    const signedAmount = parseSignedMoneyCell(cols[index])
    if (signedAmount !== null) return Math.abs(signedAmount)
  }

  const typeValue = typeIndex !== null ? normalizeHeader(cols[typeIndex]) : ''
  const typeSaysCredit = /\b(cr|credit|deposit|income|refund|money in|inflow)\b/.test(typeValue)
  const typeSaysDebit = /\b(dr|debit|withdrawal|charge|payment|purchase|spent|money out|outflow)\b/.test(typeValue)

  if (typeSaysCredit) return null

  const hasCreditValue = creditIndices.some(index => parseSignedMoneyCell(cols[index]) !== null)
  if (hasCreditValue && !typeSaysDebit) return null

  for (const index of amountIndices) {
    const signedAmount = parseSignedMoneyCell(cols[index])
    if (signedAmount === null) continue
    if (
      typeSaysDebit ||
      signedAmount < 0 ||
      allowPositiveAmountFallback
    ) {
      return Math.abs(signedAmount)
    }
  }

  return null
}

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'statement'|'receipt'>('statement')
  const [txs, setTxs] = useState<Tx[]>([])
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [currency, setCurrency] = useState('SGD')
  const [receiptScanning, setReceiptScanning] = useState(false)
  const [receiptResult, setReceiptResult] = useState<{amount:number|null;merchant:string;category:string}|null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string|null>(null)
  const [receiptDone, setReceiptDone] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    const guard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/app/login')
          return
        }
        const { data: p } = await supabase.from('profiles').select('primary_currency').eq('id', user.id).single()
        if (p) setCurrency(p.primary_currency || 'SGD')
        setAuthChecking(false)
      } catch (err) {
        console.error('Auth guard error:', err)
        router.replace('/app/login')
      }
    }
    guard()
  }, [])

  const parseCSV = (text: string): ParsedTx[] => {
    const lines = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
    if (!lines.length) return []

    const delimiter = detectDelimiter(lines)
    const headerRowIndex = findHeaderRow(lines, delimiter)
    const headers = parseCsvRow(lines[headerRowIndex] || '', delimiter).map(normalizeHeader)
    const dateIndex = findHeaderIndex(headers, [/date/, /posted/, /transaction date/]) ?? 0
    const descriptionIndex = findHeaderIndex(headers, [/description/, /merchant/, /payee/, /narration/, /details/, /transaction details/, /transaction/]) ?? 1
    const typeIndex = findHeaderIndex(headers, [/^type$/, /transaction type/, /^direction$/, /^debit\s*\/\s*credit$/, /^credit\s*\/\s*debit$/, /^debit or credit$/, /^credit or debit$/, /^dr\s*\/\s*cr$/, /^cr\s*\/\s*dr$/])
    const debitIndices = findHeaderIndices(headers, [/debit/, /withdraw/, /money out/, /outflow/, /paid out/, /charge/, /spent/])
      .filter(index => !isDirectionHeader(headers[index]) && !isDateHeader(headers[index]))
    const creditIndices = findHeaderIndices(headers, [/credit/, /deposit/, /money in/, /inflow/, /income/, /refund/])
      .filter(index => !isDirectionHeader(headers[index]) && !isDateHeader(headers[index]))
    const genericAmountIndices = findHeaderIndices(headers, [/^amount(?:\s*(?:\([^)]+\)|in\s+[a-z]{3}|[a-z]{3}))?$/, /^transaction amount(?:\s*(?:\([^)]+\)|in\s+[a-z]{3}|[a-z]{3}))?$/, /^transaction value(?:\s*(?:\([^)]+\)|in\s+[a-z]{3}|[a-z]{3}))?$/, /^value(?:\s*(?:\([^)]+\)|in\s+[a-z]{3}|[a-z]{3}))?$/])
      .filter(index => !debitIndices.includes(index) && !creditIndices.includes(index))
    const fallbackAmountIndices = headers
      .map((_, index) => index)
      .filter(index => index !== dateIndex && index !== descriptionIndex && index !== typeIndex)
    const amountIndices = genericAmountIndices.length ? genericAmountIndices : fallbackAmountIndices
    const dataLines = lines.slice(headerRowIndex + 1)
    const hasExplicitMoneyDirection = typeIndex !== null || debitIndices.length > 0 || creditIndices.length > 0
    const allowPositiveAmountFallback = !hasExplicitMoneyDirection &&
      !statementHasMixedSignedAmounts(dataLines, amountIndices, delimiter)
    const rawRows: Array<{ rawDate: string; description: string; amount: number }> = []

    for (const line of dataLines) {
      const cols = parseCsvRow(line, delimiter)
      if (cols.length < 2) continue
      const resolvedDateIndex = chooseFallbackIndex(cols, dateIndex, [], looksLikeDateCell)
      const resolvedDescriptionIndex = chooseFallbackIndex(
        cols,
        descriptionIndex,
        [resolvedDateIndex, ...amountIndices, ...debitIndices, ...creditIndices],
        value => !!value?.trim() && parseSignedMoneyCell(value) === null && !looksLikeDateCell(value),
      )
      const rawDate = cols[resolvedDateIndex]?.replace(/^\uFEFF/, '') || cols[0]?.replace(/^\uFEFF/, '') || ''
      const description = cols[resolvedDescriptionIndex] || cols[descriptionIndex] || cols[1] || 'Transaction'
      const amount = getExpenseAmount(cols, debitIndices, creditIndices, amountIndices, typeIndex, allowPositiveAmountFallback)
      if (amount && description) {
        rawRows.push({ rawDate, description, amount })
        if (rawRows.length >= 50) break
      }
    }
    const detectedDateOrder = detectNumericDateOrder(rawRows.map(row => row.rawDate))
    const dateOrder = detectedDateOrder === 'unknown'
      ? getStatementDateFallbackOrder(currency)
      : detectedDateOrder
    const results = rawRows.flatMap(row => {
      const date = normalizeDateKey(row.rawDate, dateOrder)
      return date ? [{ date, description: row.description, amount: row.amount }] : []
    })
    return results.slice(0, 50)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setParsing(true); setError(''); setTxs([])
    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      if (!parsed.length) { setError('Could not read transactions. Make sure it is a CSV file from your bank.'); setParsing(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('primary_currency').eq('id', user.id).single()
        if (p) setCurrency(p.primary_currency || 'SGD')
      }
      const res = await fetch('/api/parse-statement', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ transactions: parsed }) })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) router.replace('/app/login')
        throw new Error(payload?.error || 'Could not categorize this statement.')
      }
      const { categorized } = payload
      setTxs(parsed.map((t,i) => {
        const c = categorized?.find((x:any) => x.index === i)
        return { ...t, category: c?.category || 'Other', description: c?.description || t.description, selected: true }
      }))
    } catch (err: any) { setError(err?.message || 'Could not read this file.') }
    finally { setParsing(false) }
  }

  const handleSave = async () => {
    const sel = txs.filter(t => t.selected)
    if (!sel.length) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please sign in again.')
        router.replace('/app/login')
        return
      }
      const { error: insertError } = await supabase.from('budget_entries').insert(sel.map(t => ({
        user_id: user.id, category: t.category, amount: t.amount,
        description: t.description, entry_date: t.date || getLocalDateKey(), logged_via: 'statement'
      })))
      if (insertError) throw insertError
      setSaved(true)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptScanning(true); setReceiptResult(null); setReceiptDone(false); setError('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setReceiptPreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      try {
        const res = await fetch('/api/scan-receipt', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageBase64: base64 }) })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 401) router.replace('/app/login')
          throw new Error(payload?.error || 'Could not read this receipt.')
        }
        setReceiptResult(payload)
      } catch (err: any) {
        setError(err?.message || 'Could not read this receipt.')
        setReceiptResult({ amount: null, merchant: 'Could not read', category: 'Other' })
      }
      finally { setReceiptScanning(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveReceipt = async () => {
    if (!receiptResult?.amount) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please sign in again.')
        router.replace('/app/login')
        return
      }
      const { error: insertError } = await supabase.from('budget_entries').insert({
        user_id: user.id, category: receiptResult.category, amount: receiptResult.amount,
        description: receiptResult.merchant, entry_date: getLocalDateKey(), logged_via: 'receipt'
      })
      if (insertError) throw insertError
      setReceiptDone(true)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const sel = txs.filter(t => t.selected)

  if (authChecking) return (
    <div className="min-h-dvh bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-dvh bg-cream pb-24 md:pb-12 md:pl-32 md:pr-8 lg:pl-36">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-fraunces text-2xl font-semibold text-ink mb-1">Import transactions</h1>
        <p className="text-ink-3 text-sm">Bank statement or receipt scan</p>
      </div>
      <div className="px-5 mb-5">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          {(['statement','receipt'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===t?'bg-saffron text-white':'text-ink-3'}`}>
              <span className="inline-flex items-center justify-center gap-2">
                {t === 'statement' ? <FileText className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {t === 'statement' ? 'Bank statement' : 'Receipt scan'}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-5">
        {tab==='statement' && (
          <>
            {!txs.length && !parsing && !saved && (
              <>
                <div onClick={() => fileRef.current?.click()}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click() }}
                  role="button"
                  tabIndex={0}
                  className="card border-2 border-dashed border-saffron/30 text-center py-10 cursor-pointer active:bg-saffron-soft">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-saffron" />
                  <p className="font-medium text-ink mb-1">Upload CSV statement</p>
                  <p className="text-ink-3 text-sm mb-3">Exported from your bank app</p>
                  <span className="text-saffron text-sm font-medium">Choose file</span>
                </div>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                {error && <div className="mt-3 bg-red-50 text-danger text-sm px-4 py-3 rounded-xl">{error}</div>}
              </>
            )}
            {parsing && <div className="card text-center py-10"><div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-ink-3 text-sm">Categorising transactions...</p></div>}
            {saved && <div className="card text-center py-10"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-safe" /><p className="font-fraunces text-xl font-semibold text-ink mb-1">{sel.length} transactions saved</p><button onClick={() => router.push('/app/home')} className="btn-primary mt-4">Back to home</button></div>}
            {txs.length > 0 && !saved && (
              <>
                <div className="flex justify-between mb-3"><p className="text-sm font-medium text-ink">{sel.length} of {txs.length} selected</p><p className="text-sm text-saffron font-semibold">{formatCurrency(sel.reduce((s,t)=>s+t.amount,0),currency)}</p></div>
                <div className="flex flex-col gap-2 mb-4">
                  {txs.map((t,i) => (
                    <div key={i} className={`bg-white rounded-2xl p-3 shadow-sm ${!t.selected?'opacity-40':''}`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => setTxs(p=>p.map((x,j)=>j===i?{...x,selected:!x.selected}:x))}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${t.selected?'bg-saffron border-saffron':'border-gray-300'}`}>
                          {t.selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between gap-2"><p className="text-sm font-medium text-ink truncate">{t.description}</p><p className="text-sm font-semibold flex-shrink-0">{formatCurrency(t.amount,currency)}</p></div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-ink-3">{formatDateKey(t.date)}</p>
                            <select value={t.category} onChange={e=>setTxs(p=>p.map((x,j)=>j===i?{...x,category:e.target.value}:x))}
                              className="text-xs bg-cream rounded-lg px-2 py-1 outline-none">
                              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleSave} className="btn-primary" disabled={saving||!sel.length}>
                  {saving?<span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>:`Save ${sel.length} transactions`}
                </button>
                <button onClick={()=>{setTxs([]);setError('')}} className="btn-secondary mt-3">Upload different file</button>
              </>
            )}
          </>
        )}
        {tab==='receipt' && (
          <>
            {!receiptPreview && (
              <>
                <div onClick={()=>receiptRef.current?.click()}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') receiptRef.current?.click() }}
                  role="button"
                  tabIndex={0}
                  className="card border-2 border-dashed border-saffron/30 text-center py-10 cursor-pointer active:bg-saffron-soft">
                  <Camera className="mx-auto mb-3 h-10 w-10 text-saffron" />
                  <p className="font-medium text-ink mb-1">Scan a receipt</p>
                  <p className="text-ink-3 text-sm mb-3">Take a photo or upload from camera roll</p>
                  <span className="text-saffron text-sm font-medium">Open camera</span>
                </div>
                <input ref={receiptRef} type="file" accept="image/*" capture="environment" onChange={handleReceipt} className="hidden" />
              </>
            )}
            {receiptPreview && (
              <>
                <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-cover rounded-2xl mb-4"/>
                {receiptScanning && <div className="card text-center py-6"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-2"/><p className="text-sm text-ink-3">Reading receipt...</p></div>}
                {receiptResult && !receiptScanning && !receiptDone && (
                  <div className="card mb-4">
                    <p className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-3">Sarathy found this</p>
                    <div className="flex flex-col gap-3">
                      <div><p className="text-xs text-ink-3 mb-1">Amount</p><p className="font-fraunces text-2xl font-semibold">{receiptResult.amount?formatCurrency(receiptResult.amount,currency):'Could not read'}</p></div>
                      <div><p className="text-xs text-ink-3 mb-1">Merchant</p><p className="font-medium">{receiptResult.merchant}</p></div>
                      <div><p className="text-xs text-ink-3 mb-1">Category</p>
                        <select value={receiptResult.category} onChange={e=>setReceiptResult(p=>p?{...p,category:e.target.value}:p)} className="input-field">
                          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {receiptDone && <div className="card text-center py-8 mb-4"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-safe" /><p className="font-medium">Receipt saved!</p></div>}
                {error && <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
                {!receiptDone && receiptResult && !receiptScanning && (
                  <button onClick={handleSaveReceipt} className="btn-primary mb-3" disabled={saving||!receiptResult.amount}>
                    {saving?<span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>:'Save this expense'}
                  </button>
                )}
                <button onClick={()=>{setReceiptPreview(null);setReceiptResult(null);setReceiptDone(false);setError('')}} className="btn-secondary">
                  {receiptDone?'Scan another':'Try different photo'}
                </button>
                {receiptDone && <button onClick={()=>router.push('/app/home')} className="btn-primary mt-3">Back to home</button>}
              </>
            )}
          </>
        )}
      </div>
      <TabBar active="story"/>
    </div>
  )
}
