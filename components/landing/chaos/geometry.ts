import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import type { Item } from './items'
import { cardColor, type ChaosPalette } from './palette'

function outline(item: Item): THREE.Shape {
  const w = item.width, h = item.height, s = new THREE.Shape()
  if (item.type === 'receipt') {
    s.moveTo(-w / 2, h / 2); s.lineTo(w / 2, h / 2); s.lineTo(w / 2, -h / 2 + 5)
    for (let x = w; x >= 0; x -= 4) s.lineTo(x - w / 2, -h / 2 + (Math.round(x / 4) % 2 ? 5 : 0))
    s.closePath()
  } else {
    const r = 22, x = -w / 2, y = -h / 2
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); s.closePath()
  }
  return s
}

export function createObject(item: Item, texture: THREE.CanvasTexture, palette: ChaosPalette): THREE.Group {
  const group = new THREE.Group()
  let geometry: THREE.BufferGeometry
  let material: THREE.Material
  if (item.type === 'coin') {
    geometry = new THREE.CylinderGeometry(28, 28, 7, 56)
    geometry.rotateX(Math.PI / 2)
    const edge = new THREE.MeshStandardMaterial({ color: palette.coinMetal, metalness: palette.coinMetalness, roughness: palette.coinRoughness, envMapIntensity: palette.coinEnvironmentIntensity })
    // A warm face tint retains gold in bright reflections after ACES tonemapping.
    const face = new THREE.MeshStandardMaterial({ color: palette.coinFaceTint, map: texture, metalness: palette.coinMetalness, roughness: palette.coinRoughness, envMapIntensity: palette.coinEnvironmentIntensity, bumpMap: texture, bumpScale: 0.12 })
    const coin = new THREE.Mesh(geometry, [edge, face, face]); coin.castShadow = true; group.add(coin)
    return group
  }
  if (item.type === 'card') {
    geometry = new RoundedBoxGeometry(item.width, item.height, item.thickness, 4, 9)
    material = new THREE.MeshPhysicalMaterial({ color: cardColor(item.id, palette), roughness: palette.cardRoughness, clearcoat: palette.cardClearcoat, clearcoatRoughness: palette.cardClearcoatRoughness })
  } else {
    geometry = new THREE.ExtrudeGeometry(outline(item), { depth: item.thickness, bevelEnabled: item.type === 'pill', bevelSize: 1.2, bevelThickness: 0.8, bevelSegments: 3, steps: 1, curveSegments: 12 })
    geometry.translate(0, 0, -item.thickness / 2)
    material = new THREE.MeshPhysicalMaterial({ color: item.type === 'receipt' ? palette.receiptPaper : palette.pillSurface, roughness: item.type === 'receipt' ? palette.paperRoughness : palette.pillRoughness, clearcoat: item.type === 'pill' ? palette.pillClearcoat : 0, sheen: item.type === 'receipt' ? palette.paperSheen : 0 })
  }
  const body = new THREE.Mesh(geometry, material); body.castShadow = true; group.add(body)
  const front = item.type === 'card' ? new THREE.ShapeGeometry((() => {
    const s = new THREE.Shape(), w = item.width - 3, h = item.height - 3, r = 8
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s
  })()) : new THREE.ShapeGeometry(outline(item))
  // ShapeGeometry's world-space UVs are normalized explicitly for the face painter.
  const uv = front.getAttribute('uv'), position = front.getAttribute('position')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, position.getX(i) / item.width + 0.5, position.getY(i) / item.height + 0.5)
  // Printed ink must retain its actual palette contrast. White environment
  // reflections on a physical print layer previously washed out small labels.
  // Cards use the same colour-faithful print as paper/pills; their painted sheen
  // remains in the texture and the extruded body still receives physical light.
  const faceMaterial = new THREE.MeshBasicMaterial({ color: palette.printTint, map: texture, alphaTest: 0.5, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  const face = new THREE.Mesh(front, faceMaterial)
  face.position.z = item.thickness / 2 + (item.type === 'pill' ? 0.82 : 0.025)
  group.add(face)
  return group
}
