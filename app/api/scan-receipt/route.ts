import { NextRequest, NextResponse } from 'next/server'
import { generateWithOpenAI, isOpenAIConfigured } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: 'AI receipt scanning is not configured.' }, { status: 503 })
    }

    const { imageBase64 } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 })
    const raw = await generateWithOpenAI({
      maxOutputTokens: 300,
      content: [
        { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' },
        { type: 'input_text', text: 'Extract from this receipt: total amount, merchant name, and category (Food/Transport/Social/Home/Family/Shopping/Health/Education/Entertainment/Other). Return ONLY JSON: {"amount": 12.50, "merchant": "McDonalds", "category": "Food"}' },
      ],
    })
    const cleaned = (raw || '{}').replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ amount: null, merchant: 'Could not read receipt', category: 'Other' })
  }
}
