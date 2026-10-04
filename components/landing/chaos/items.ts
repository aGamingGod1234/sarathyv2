export type Lane = 'fixed' | 'spending' | 'goals'
export type Item = {
  id: string
  lane: Lane
  type: 'receipt' | 'pill' | 'card' | 'coin'
  title: string
  amount: string
  lines?: string[]
  sub?: string
  last4?: string
  positive?: boolean
  core?: boolean
  width: number
  height: number
  thickness: number
}

export const lanes: Lane[] = ['fixed', 'spending', 'goals']
const receipt = { type: 'receipt' as const, width: 128, height: 206, thickness: 1.2 }
const pill = { type: 'pill' as const, width: 244, height: 66, thickness: 9 }
const card = { type: 'card' as const, width: 172, height: 108, thickness: 5 }
export const items: Item[] = [
  { ...receipt, id: 'hall', lane: 'fixed', title: 'Hall fees', amount: 'S$560.00', lines: ['Term 1 instalment', 'Due 5 Oct'], height: 224, core: true },
  { ...pill, id: 'spotify', lane: 'fixed', title: 'Spotify Student', amount: 'S$5.99/mo', core: true },
  { ...pill, id: 'mrt', lane: 'fixed', title: 'MRT concession', amount: 'S$64.00', core: true },
  { ...pill, id: 'phone', lane: 'fixed', title: 'Phone plan', amount: 'S$15.00' },
  { ...receipt, id: 'books', lane: 'fixed', title: 'Textbooks', amount: 'S$42.80', lines: ['Co-op', '2 items'], height: 216 },
  { ...receipt, id: 'kopi', lane: 'spending', title: 'Kopi O', amount: 'S$1.80', lines: ['Hawker, Clementi'], core: true },
  { ...receipt, id: 'rice', lane: 'spending', title: 'Chicken rice', amount: 'S$4.50', lines: ['Food court'], core: true },
  { ...pill, id: 'grab', lane: 'spending', title: 'Grab', amount: 'S$14.20', sub: 'Late ride home', core: true },
  { ...pill, id: 'shopee', lane: 'spending', title: 'Shopee', amount: 'S$23.90', sub: 'Desk lamp' },
  { ...receipt, id: 'tea', lane: 'spending', title: 'Bubble tea', amount: 'S$5.60', lines: ['Less sugar'], height: 190 },
  { ...card, id: 'debit', lane: 'spending', title: 'Debit', amount: '', last4: '4821', core: true },
  { ...card, id: 'credit', lane: 'spending', title: 'Credit', amount: '', last4: '0317' },
  { ...pill, id: 'mum', lane: 'goals', title: 'PayNow from Mum', amount: '+S$300.00', positive: true, core: true },
  { ...pill, id: 'pay', lane: 'goals', title: 'Part-time pay', amount: '+S$420.00', positive: true, core: true },
  { ...receipt, id: 'trip', lane: 'goals', title: 'Trip home', amount: 'S$600 goal', lines: ['Dec', '38% saved'], height: 216, core: true },
  ...Array.from({ length: 5 }, (_, i): Item => ({ id: `coin-${i}`, lane: 'goals', type: 'coin', title: '1', amount: '', width: 56, height: 56, thickness: 7, core: i < 3 })),
]
