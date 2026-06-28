import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return null
  }

  return new Groq({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    const groq = getGroqClient()
    if (!groq) {
      return NextResponse.json({ categorized: [], error: 'AI statement parsing is not configured.' }, { status: 503 })
    }

    const { transactions } = await req.json()
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ categorized: [] })
    }
    const prompt = `Categorize each transaction into one of: Food, Transport, Social, Home, Family, Shopping, Health, Education, Entertainment, Other. Return ONLY a JSON array: [{"index":0,"category":"Food","description":"McDonald's lunch"}]. Transactions: ${transactions.map((t: any, i: number) => `${i}. Amount: ${t.amount}, Description: "${t.description}"`).join('\n')}`
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = completion.choices[0]?.message?.content || '[]'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const categorized = JSON.parse(cleaned)
    return NextResponse.json({ categorized })
  } catch (error) {
    return NextResponse.json({ categorized: [] })
  }
}
