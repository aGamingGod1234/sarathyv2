import type { Item, Lane } from './items'

export type Rect = { x: number; y: number; width: number; height: number }
export type Point = { x: number; y: number }
export const seed = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v) }

export function clearFootprint(x: number, y: number, hx: number, hy: number, zones: Rect[], width: number, height: number): boolean {
  if (x < hx || x > width - hx || y < hy || y > height - hy) return false
  for (const zone of zones) if (x > zone.x - hx - 24 && x < zone.x + zone.width + hx + 24 && y > zone.y - hy - 24 && y < zone.y + zone.height + hy + 24) return false
  return true
}

/** Find an escape that respects every zone, including the nav above the copy. */
export function constrain(point: Point, hx: number, hy: number, zones: Rect[], width: number, height: number): boolean {
  if (clearFootprint(point.x, point.y, hx, hy, zones, width, height)) return true
  let best = Infinity, bestX = point.x, bestY = point.y
  // Candidate axes comprise the current coordinate, desk bounds and all zone edges.
  for (let xi = -3; xi < zones.length * 2; xi++) {
    const x = xi === -3 ? point.x : xi === -2 ? hx : xi === -1 ? width - hx : xi % 2 === 0 ? zones[xi >> 1].x - hx - 24 : zones[xi >> 1].x + zones[xi >> 1].width + hx + 24
    for (let yi = -3; yi < zones.length * 2; yi++) {
      const y = yi === -3 ? point.y : yi === -2 ? hy : yi === -1 ? height - hy : yi % 2 === 0 ? zones[yi >> 1].y - hy - 24 : zones[yi >> 1].y + zones[yi >> 1].height + hy + 24
      const cost = (x - point.x) ** 2 + (y - point.y) ** 2
      if (cost < best && clearFootprint(x, y, hx, hy, zones, width, height)) { best = cost; bestX = x; bestY = y }
    }
  }
  if (best === Infinity) return false
  point.x = bestX; point.y = bestY
  return true
}

export type CloudSlot = { x: number; y: number; z: number; scale: number }

/** Pack only valid free space; uniform sizing is fitted to that actual space. */
export function cloudSlots(data: Item[], width: number, height: number, baseScale: number, distance: number, zones: Rect[]): CloudSlot[] {
  const order = data.map((_, i) => i).sort((a, b) => data[b].width * data[b].height - data[a].width * data[a].height)
  const slots = data.map((_, i) => ({ x: 0, y: 0, z: 60 + seed(i + 19) * Math.min(360, distance * 0.3), scale: baseScale }))
  const footprints = data.map(() => ({ hx: 0, hy: 0 }))
  let factor = 1
  // Each retry solves the same geometric constraints at a smaller uniform scale,
  // rather than putting an impossible-to-fit receipt under the headline.
  for (let trial = 0; trial < 32; trial++, factor *= 0.94) {
    const placed: number[] = []
    let overlaps = false
    for (const i of order) {
      const slot = slots[i], item = data[i], perspective = distance / (distance - slot.z)
      slot.scale = baseScale * factor
      const hx = (item.width + item.height * 0.18) * slot.scale * perspective / 2 + 14
      const hy = (item.height + item.width * 0.18) * slot.scale * perspective / 2 + 14
      footprints[i] = { hx, hy }
      let best = Infinity, bestOverlap = Infinity, x = width / 2, y = height / 2
      for (let candidate = 0; candidate < 900; candidate++) {
        const cx = hx + seed(i * 997 + candidate * 2 + 911) * Math.max(0, width - 2 * hx)
        const cy = hy + seed(i * 991 + candidate * 2 + 412) * Math.max(0, height - 2 * hy)
        if (!clearFootprint(cx, cy, hx, hy, zones, width, height)) continue
        let overlap = 0
        for (const j of placed) overlap += Math.max(0, hx + footprints[j].hx - Math.abs(cx - slots[j].x)) * Math.max(0, hy + footprints[j].hy - Math.abs(cy - slots[j].y))
        const preferredX = width * (0.05 + seed(i + 2) * 0.9), preferredY = height * (0.05 + seed(i + 83) * 0.9)
        const cost = overlap * 1e6 + (cx - preferredX) ** 2 + (cy - preferredY) ** 2
        if (cost < best) { best = cost; bestOverlap = overlap; x = cx; y = cy }
      }
      overlaps ||= bestOverlap > 0
      slot.x = x; slot.y = y; placed.push(i)
    }
    if (!overlaps) break
  }
  return slots
}

export const representative: Record<Lane, string> = { fixed: 'spotify', spending: 'debit', goals: 'mum' }
// Seven readable objects occupy the small area left around the phone's copy.
export const lowItems = new Set(['hall', 'spotify', 'kopi', 'debit', 'mum', 'trip', 'coin-0'])
