import { NextRequest, NextResponse } from 'next/server'
import { generateWithOpenAI, isOpenAIConfigured } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ categorized: [], error: 'AI statement parsing is not configured.' }, { status: 503 })
    }

    const { transactions } = await req.json()
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ categorized: [] })
    }
    const prompt = `Categorize each transaction into one of: Food, Transport, Social, Home, Family, Shopping, Health, Education, Entertainment, Other. Return ONLY a JSON array: [{"index":0,"category":"Food","description":"McDonald's lunch"}]. Transactions: ${transactions.map((t: any, i: number) => `${i}. Amount: ${t.amount}, Description: "${t.description}"`).join('\n')}`
    const raw = await generateWithOpenAI({
      maxOutputTokens: 2000,
      content: [{ type: 'input_text', text: prompt }],
    })
    const cleaned = (raw || '[]').replace(/```json|```/g, '').trim()
    const categorized = JSON.parse(cleaned)
    return NextResponse.json({ categorized })
  } catch (error) {
    return NextResponse.json({ categorized: [] })
  }
}
