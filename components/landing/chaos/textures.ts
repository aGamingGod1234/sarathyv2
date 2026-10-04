import { CanvasTexture, Color, SRGBColorSpace } from 'three'
import type { Item } from './items'
import { cardColor, type ChaosPalette } from './palette'

export async function readyFont(fontFamily: string, fallback: string): Promise<string> {
  await document.fonts.ready
  const variable = /^var\((--[\w-]+)\)$/.exec(fontFamily.trim())
  const family = (variable ? getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim() : fontFamily) || fallback
  await Promise.all([500, 600, 700, 800].map(weight => document.fonts.load(`${weight} 32px ${family}`)))
  return family
}

export function paintTexture(item: Item, family: string, anisotropy: number, palette: ChaosPalette): CanvasTexture {
  const canvas = document.createElement('canvas')
  const density = Math.min(3, 2048 / Math.max(item.width, item.height))
  canvas.width = Math.ceil(item.width * density)
  canvas.height = Math.ceil(item.height * density)
  const c = canvas.getContext('2d')!
  c.scale(density, density)
  const w = item.width, h = item.height
  const text = (value: string, x: number, y: number, size: number, weight: number, color = palette.ink, align: CanvasTextAlign = 'left') => {
    c.font = `${weight} ${size}px ${family}`
    c.fillStyle = color
    c.textAlign = align
    c.fillText(value, x, y)
  }
  if (item.type === 'coin') {
    c.fillStyle = palette.coinMetal; c.fillRect(0, 0, w, h)
    c.strokeStyle = palette.coinDetail; c.lineWidth = 0.65
    for (const r of [24, 21.5]) { c.beginPath(); c.arc(28, 28, r, 0, Math.PI * 2); c.stroke() }
    c.font = `600 30px ${palette.coinFontFamily}`; c.textAlign = 'center'; c.fillStyle = palette.coinNumeral; c.fillText('1', 28, 38)
  } else if (item.type === 'card') {
    c.fillStyle = cardColor(item.id, palette); c.fillRect(0, 0, w, h)
    const gradient = c.createLinearGradient(0, h, w, 0)
    const rgb = new Color(palette.cardSheen).getHex(SRGBColorSpace)
    const sheen = (alpha: number) => `rgba(${rgb >> 16 & 255},${rgb >> 8 & 255},${rgb & 255},${alpha})`
    gradient.addColorStop(0, sheen(0)); gradient.addColorStop(0.55, sheen(palette.cardSheenOpacity)); gradient.addColorStop(1, sheen(palette.cardSheenEdgeOpacity))
    c.fillStyle = gradient; c.fillRect(0, 0, w, h)
    c.globalAlpha = 1
    text(item.title, 15, 23, 12, 700, palette.cardInk)
    c.fillStyle = palette.chipSurface; c.beginPath(); c.roundRect(16, 36, 27, 21, 4); c.fill()
    c.strokeStyle = palette.chipDetail; c.lineWidth = 0.7
    c.strokeRect(24, 40, 11, 13)
    for (const y of [43, 49]) { c.beginPath(); c.moveTo(16, y); c.lineTo(43, y); c.stroke() }
    text(`•• ${item.last4}`, 15, 88, 15, 600, palette.cardInk)
    c.fillStyle = palette.cardMark; c.globalAlpha = palette.cardMarkOpacity
    for (const x of [137, 148]) { c.beginPath(); c.arc(x, 82, 9, 0, Math.PI * 2); c.fill() }
  } else if (item.type === 'pill') {
    c.fillStyle = palette.pillSurface; c.fillRect(0, 0, w, h)
    c.fillStyle = item.positive ? palette.positiveIcon : palette.pillIcon; c.beginPath(); c.roundRect(12, 16, 34, 34, 10); c.fill()
    text(item.positive ? '↙' : item.title[0], 29, 39, 18, 700, palette.iconInk, 'center')
    text(item.title, 56, 25, 13, 700)
    if (item.sub) text(item.sub, 56, 46, 10, 600, palette.mutedInk)
    text(item.amount, w - 15, 47, 13, 800, item.positive ? palette.positiveAmount : palette.negativeAmount, 'right')
  } else {
    // The silhouette is shared with the extruded body, including the torn edge.
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h - 5)
    for (let x = w; x >= 0; x -= 4) c.lineTo(x, h - (Math.round(x / 4) % 2 ? 5 : 0))
    c.closePath(); c.fillStyle = palette.receiptPaper; c.fill()
    text(item.title, 12, 28, 14, 700)
    text('SARATHY / MONEY NOTE', 12, 44, 7, 600, palette.mutedInk)
    item.lines?.forEach((line, index) => text(line, 12, 71 + index * 17, 10, 600, palette.mutedInk))
    c.strokeStyle = palette.receiptRule; c.lineWidth = 0.7; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(12, h - 67); c.lineTo(w - 12, h - 67); c.stroke(); c.setLineDash([])
    text('TOTAL', 12, h - 33, 8, 700, palette.mutedInk)
    text(item.amount, w - 12, h - 33, 12, 800, palette.negativeAmount, 'right')
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy
  if (item.type === 'coin') { texture.center.set(0.5, 0.5); texture.rotation = Math.PI / 2 }
  return texture
}
