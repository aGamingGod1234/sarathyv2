import * as THREE from 'three'
import { RoomEnvironment } from 'three-stdlib'
import { items, lanes, type Item, type Lane } from './items'
import { createObject } from './geometry'
import { paintTexture, readyFont } from './textures'
import { type ChaosPalette } from './palette'
import { cloudSlots, constrain, lowItems, representative, seed, type Rect } from './layout'

type Options = {
  host: HTMLDivElement; stage: HTMLElement; progress: { current: number }
  reducedMotion: boolean; quality: 'high' | 'low'; ready: () => void; unavailable: () => void
  palette: ChaosPalette
}
export type SceneController = { dispose: () => void; setPalette: (palette: ChaosPalette) => void }
type Body = {
  data: Item; mesh: THREE.Group; rank: number; laneIndex: number
  chaos: THREE.Vector3; sorted: THREE.Vector3; stack: THREE.Vector3
  chaosGoal: THREE.Vector3; sortedGoal: THREE.Vector3; stackGoal: THREE.Vector3
  chaosScale: number; sortedScale: number; stackScale: number
  chaosScaleGoal: number; sortedScaleGoal: number; stackScaleGoal: number
  rotation: THREE.Quaternion; angle: THREE.Euler; phase: number
  push: THREE.Vector3; velocity: THREE.Vector3; target: THREE.Vector3
  spin: number; spinVelocity: number
  extent: THREE.Vector3; flight: number
}
const clamp = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t) }
const ease = (v: number) => { const t = clamp(v); return 1 - (1 - t) ** 3 }

/** Anchor reads live in measure(); scroll only updates origin and visible exclusions. */
export function mountScene(options: Options): SceneController {
  const { host, stage, progress, quality, reducedMotion } = options
  let disposed = false, renderer: THREE.WebGLRenderer, palette = options.palette
  let paletteSignature = JSON.stringify(palette), paletteGeneration = 0
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  } catch { options.unavailable(); return { dispose: () => {}, setPalette: () => {} } }
  renderer.setClearColor(palette.clearColor, palette.clearOpacity)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = palette.exposure
  // A distant caster projects a detached silhouette across the phone's small
  // stage. Spend the low tier's shadow pass on readable print resolution instead.
  renderer.shadowMap.enabled = quality === 'high'
  // r185's PCF uses hardware-filtered soft taps; PCFSoft is now deprecated.
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none'
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, 1, 20000)
  scene.environmentIntensity = palette.environmentIntensity
  function makeEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer), room = RoomEnvironment()
    const originalRender = renderer.render
    // r185 GGX sample directions contain sin/cos roundoff at cardinal angles.
    // ANGLE/D3D11 warns when folding these sub-float terms into hemisphere sums.
    // Normalize only that shader's negligible terms via its public compile hook.
    renderer.render = (object, view) => {
      const material = (object as THREE.Mesh).material
      if (material instanceof THREE.ShaderMaterial && material.name === 'PMREMGGXConvolution') {
        material.onBeforeCompile = shader => {
          shader.fragmentShader = shader.fragmentShader
            .replace('float t1 = r * cos(phi);', 'float phiCos = cos(phi); float t1 = r * (abs(phiCos) < 1e-7 ? 0.0 : phiCos);')
            .replace('float t2 = r * sin(phi);', 'float phiSin = sin(phi); float t2 = r * (abs(phiSin) < 1e-7 ? 0.0 : phiSin);')
        }
      }
      originalRender.call(renderer, object, view)
    }
    let target: THREE.WebGLRenderTarget
    try { target = pmrem.fromScene(room, palette.environmentBlur) } finally { renderer.render = originalRender }
    room.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach(material => material.dispose())
      }
    })
    pmrem.dispose()
    return target
  }
  let environment = makeEnvironment()
  scene.environment = environment.texture
  const fill = new THREE.HemisphereLight(palette.hemisphereSky, palette.hemisphereGround, palette.hemisphereIntensity)
  scene.add(fill)
  const key = new THREE.DirectionalLight(palette.keyLightColor, palette.keyLightIntensity)
  key.castShadow = quality === 'high'; key.shadow.mapSize.setScalar(2048)
  key.shadow.bias = palette.shadowBias; key.shadow.normalBias = palette.shadowNormalBias; key.shadow.radius = palette.floatingShadowRadius
  scene.add(key, key.target)
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ color: palette.shadowColor, opacity: palette.shadowOpacity }))
  desk.receiveShadow = true; desk.visible = quality === 'high'; desk.position.z = -0.05; scene.add(desk)
  const bodies: Body[] = []
  const identity = new THREE.Quaternion(), tempQuaternion = new THREE.Quaternion(), projected = new THREE.Vector3()
  const screenPoint = { x: 0, y: 0 }
  let width = 1, height = 1, distance = 1, scale = 1, stageLeft = 0, stageTop = 0
  let p = clamp(progress.current || 0), pVelocity = 0, raf = 0, timer = 0, lostTimer = 0, measureRaf = 0, exclusionRaf = 0
  let visible = true, contextLost = false, initialized = false, didReady = false, lastTime = 0, idleTime = 0, dirty = true
  let pointerX = -10000, pointerY = -10000, pointerVX = 0, pointerVY = 0, pointerTime = 0, touching = false
  let tiltX = 0, tiltY = 0, measured = false
  let layoutSignature = '', cloudSignature = '', cloudViewport = '', haveLayout = false
  let lastScrollProgress = progress.current
  let laneRects: Record<Lane, Rect>, stackRects: Record<Lane, Rect>, exclusions: Rect[] = []

  function measure() {
    if (disposed || contextLost) return
    const bounds = stage.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return
    width = bounds.width; height = bounds.height
    stageLeft = bounds.left; stageTop = bounds.top; scale = width < 640 ? 0.66 : 1
    distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(14)))
    // A near plane of 1 wastes depth precision at CSS-pixel camera distances
    // and makes the thin face layers fight their bodies. Keep the cloud inside
    // a tight depth range instead; this preserves the same z=0 pixel mapping.
    camera.near = Math.max(1, distance * 0.2); camera.far = distance * 3 + 800
    camera.aspect = width / height; camera.position.set(0, 0, distance); camera.rotation.set(0, 0, 0); camera.updateProjectionMatrix()
    const dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.75 : 2)
    if (renderer.getPixelRatio() !== dpr) renderer.setPixelRatio(dpr)
    if (renderer.domElement.width !== Math.floor(width * dpr) || renderer.domElement.height !== Math.floor(height * dpr)) renderer.setSize(width, height, false)
    desk.scale.set(width * 2, height * 2, 1)
    key.position.set(distance * palette.keyLightX, distance * palette.keyLightY, distance); key.target.position.set(0, 0, 0)
    const shadow = key.shadow.camera
    shadow.left = -width; shadow.right = width; shadow.top = height; shadow.bottom = -height
    shadow.near = 1; shadow.far = distance * 3 + 1200; shadow.updateProjectionMatrix()
    const rect = (element: Element): Rect => {
      const r = element.getBoundingClientRect()
      return { x: r.left - bounds.left, y: r.top - bounds.top, width: r.width, height: r.height }
    }
    const previousLanes = laneRects, previousStacks = stackRects
    laneRects = {} as Record<Lane, Rect>; stackRects = {} as Record<Lane, Rect>
    lanes.forEach((lane, i) => {
      const anchor = stage.querySelector(`[data-chaos-lane="${lane}"]`)
      const candidate = anchor ? rect(anchor) : null
      laneRects[lane] = candidate && candidate.width > 0 && candidate.height > 0 ? candidate : previousLanes?.[lane] || { x: width * (0.1 + i * 0.8 / 3), y: height * 0.3, width: width * 0.8 / 3, height: height * 0.58 }
      const stack = stage.querySelector(`[data-chaos-stack="${lane}"]`)
      const stackCandidate = stack ? rect(stack) : null
      stackRects[lane] = stackCandidate && stackCandidate.width > 0 && stackCandidate.height > 0 ? stackCandidate : previousStacks?.[lane] || { ...laneRects[lane], height: height * 0.26 }
    })
    refreshExclusions(bounds)
    const signature = JSON.stringify([width, height, laneRects, stackRects, bodies.length], (_, v) => typeof v === 'number' ? Math.round(v * 4) / 4 : v)
    const cloud = JSON.stringify([width, height, exclusions, bodies.length], (_, v) => typeof v === 'number' ? Math.round(v * 4) / 4 : v)
    const viewport = JSON.stringify([width, height, bodies.length])
    const repack = cloud !== cloudSignature && (!haveLayout || progress.current <= 0.14 || viewport !== cloudViewport)
    if (signature !== layoutSignature || repack) { layout(repack); layoutSignature = signature; if (repack) { cloudSignature = cloud; cloudViewport = viewport } }
    measured = true; dirty = true
    if (initialized && reducedMotion) draw(performance.now(), true)
    else wake()
  }

  function refreshExclusions(bounds: DOMRect) {
    const next: Rect[] = []
    stage.querySelectorAll('[data-chaos-exclusion]').forEach(element => {
      const style = getComputedStyle(element)
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return
      const r = element.getBoundingClientRect()
      let left = r.left, top = r.top, right = r.right, bottom = r.bottom
      // Intro transforms on children can extend beyond the parent's layout box.
      element.querySelectorAll('*').forEach(child => { const c = child.getBoundingClientRect(); left = Math.min(left, c.left); top = Math.min(top, c.top); right = Math.max(right, c.right); bottom = Math.max(bottom, c.bottom) })
      next.push({ x: left - bounds.left, y: top - bounds.top, width: right - left, height: bottom - top })
    })
    exclusions = next
  }

  function scrollMeasure() {
    // Pinning changes the stage's viewport origin, not its local anchor layout.
    // Never reseed the cloud or retarget a pile on an ordinary scroll frame.
    const bounds = stage.getBoundingClientRect()
    stageLeft = bounds.left; stageTop = bounds.top
    if (progress.current <= 0.14) refreshExclusions(bounds)
    if (lastScrollProgress > 0 && progress.current === 0) queueMeasure()
    lastScrollProgress = progress.current
  }

  function queueExclusions() {
    if (!exclusionRaf) exclusionRaf = requestAnimationFrame(() => { exclusionRaf = 0; if (!disposed) refreshExclusions(stage.getBoundingClientRect()) })
  }

  function layout(repack: boolean) {
    if (repack) {
      const slots = cloudSlots(bodies.map(body => body.data), width, height, scale, distance, exclusions)
      bodies.forEach((body, i) => {
        const slot = slots[i], perspective = distance / (distance - slot.z)
        body.chaosGoal.set((slot.x - width / 2) / perspective, (height / 2 - slot.y) / perspective, slot.z)
        body.chaosScaleGoal = slot.scale
      })
    }
    for (const laneName of lanes) {
      const members = bodies.filter(body => body.data.lane === laneName && body.data.type !== 'coin')
      if (!members.length) continue
      const coins = bodies.filter(body => body.data.lane === laneName && body.data.type === 'coin')
      const lane = laneRects[laneName], stack = stackRects[laneName]
      const sortedScale = Math.min(scale, (lane.width - 12) / Math.max(...members.map(body => body.data.width)))
      let spacing = 70 * scale
      members.forEach((body, i) => { if (i > 0) spacing = Math.min(spacing, Math.max(0, (lane.height - 12 - body.data.height * sortedScale) / i)) })
      let sortedZ = 0
      members.forEach((body, rank) => {
        body.sortedScaleGoal = sortedScale
        body.sortedGoal.set(lane.x + lane.width / 2 - width / 2, height / 2 - lane.y - 6 - rank * spacing - body.data.height * sortedScale / 2, sortedZ + body.data.thickness * sortedScale / 2)
        sortedZ += (body.data.thickness + (body.data.type === 'pill' ? 1.65 : 0.08)) * sortedScale + 1.5
      })
      const top = members.find(body => body.data.id === representative[laneName]) || members[members.length - 1]
      const ordered = members.filter(body => body !== top).sort((a, b) => (a.data.type === 'receipt' ? 0 : 1) - (b.data.type === 'receipt' ? 0 : 1))
      ordered.push(top)
      const coinWidth = coins.length ? Math.min(40 * scale, stack.width * 0.2) : 0
      const coinSpace = coins.length ? coinWidth + 8 * scale : 0
      const contentWidth = stack.width - coinSpace - 8
      const dx = 1.5 * scale, dy = 1.5 * scale, cascade = ordered.length - 1
      const topScale = Math.min(scale, (contentWidth - cascade * dx) / top.data.width, (stack.height - 8 - cascade * dy) / top.data.height)
      const footprintWidth = top.data.width * topScale, footprintHeight = top.data.height * topScale
      const centerX = stack.x + (stack.width - coinSpace) / 2
      const centerY = stack.y + stack.height / 2
      let stackZ = 0
      ordered.forEach((body, rank) => {
        // Every object keeps a uniform x/y scale, inside the top item's silhouette.
        // Paper can no longer form a long blank tail beneath a legible pill/card.
        const itemScale = Math.min(footprintWidth / body.data.width, footprintHeight / body.data.height)
        body.stackScaleGoal = itemScale
        body.stackGoal.set(centerX - width / 2 + (rank - cascade) * dx, height / 2 - centerY - (rank - cascade) * dy, stackZ + body.data.thickness * itemScale / 2)
        stackZ += (body.data.thickness + (body.data.type === 'pill' ? 1.65 : 0.08)) * itemScale
      })
      coins.forEach((body, rank) => {
        body.sortedScaleGoal = sortedScale
        body.sortedGoal.set(lane.x + lane.width / 2 - width / 2 + (rank % 2 ? 18 : -18) * sortedScale, height / 2 - lane.y - lane.height + 30 * sortedScale + 4, (Math.floor(rank / 2) + 0.5) * body.data.thickness * sortedScale)
        body.stackScaleGoal = coinWidth / body.data.width
        // An independent tower in the reserved side gutter, never over a tile.
        body.stackGoal.set(stack.x + stack.width - 4 - coinWidth / 2 - width / 2, height / 2 - centerY, (rank + 0.5) * body.data.thickness * body.stackScaleGoal)
      })
    }
    for (const body of bodies) {
      body.sortedGoal.x *= 1 - body.sortedGoal.z / distance; body.sortedGoal.y *= 1 - body.sortedGoal.z / distance
      body.stackGoal.x *= 1 - body.stackGoal.z / distance; body.stackGoal.y *= 1 - body.stackGoal.z / distance
      if (!haveLayout) {
        body.chaos.copy(body.chaosGoal); body.sorted.copy(body.sortedGoal); body.stack.copy(body.stackGoal)
        body.chaosScale = body.chaosScaleGoal; body.sortedScale = body.sortedScaleGoal; body.stackScale = body.stackScaleGoal
      }
    }
    if (bodies.length) haveLayout = true
  }

  function draw(now: number, staticFrame = false) {
    if (!initialized || !measured || disposed || contextLost) return
    // The exact spring is stable even after a slow software-rendered frame.
    // A 50ms cap would make scrolling visibly lag on weak GPUs.
    const dt = Math.min(0.5, lastTime ? (now - lastTime) / 1000 : 1 / 60)
    lastTime = now
    const targetProgress = clamp(Number.isFinite(progress.current) ? progress.current : 0)
    if (staticFrame) { p = targetProgress; pVelocity = 0 }
    else {
      // Exact solution of a critically damped spring, stable across frame rates.
      const omega = 1 / 0.18, difference = p - targetProgress, c = pVelocity + omega * difference, decay = Math.exp(-omega * dt)
      p = targetProgress + (difference + c * dt) * decay
      pVelocity = (pVelocity - omega * c * dt) * decay
      if (Math.abs(p - targetProgress) < 0.00002 && Math.abs(pVelocity) < 0.0001) { p = targetProgress; pVelocity = 0 }
      idleTime += dt
    }
    const chaosWeight = 1 - smooth((p - 0.14) / 0.16)
    const floatingShadow = 1 - smooth((p - 0.14) / 0.38)
    key.shadow.radius = palette.shadowRadius + (palette.floatingShadowRadius - palette.shadowRadius) * floatingShadow
    // PCF only softens silhouette edges, leaving a full-strength rectangular
    // centre even far above the desk. Approximate the floating penumbra's weaker
    // density, keeping the existing contact shadows as objects touch down.
    desk.material.opacity = palette.shadowOpacity * (1 - 0.7 * floatingShadow)
    const pointerEnabled = quality === 'high' && !reducedMotion
    const tx = pointerEnabled && pointerX > -9000 ? Math.max(-1, Math.min(1, pointerY / (height / 2))) * 0.02618 : 0
    const ty = pointerEnabled && pointerX > -9000 ? Math.max(-1, Math.min(1, pointerX / (width / 2))) * 0.02618 : 0
    tiltX += (tx - tiltX) * (1 - Math.exp(-dt * 10)); tiltY += (ty - tiltY) * (1 - Math.exp(-dt * 10))
    camera.position.set(Math.sin(tiltY * chaosWeight) * distance, Math.sin(tiltX * chaosWeight) * distance, distance)
    camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
    let active = false
    const recent = now - pointerTime < 120 ? 1 : 0
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i], item = body.data
      const blend = staticFrame ? 1 : 1 - Math.exp(-dt / 0.2)
      body.chaos.lerp(body.chaosGoal, blend); body.sorted.lerp(body.sortedGoal, blend); body.stack.lerp(body.stackGoal, blend)
      body.chaosScale += (body.chaosScaleGoal - body.chaosScale) * blend
      body.sortedScale += (body.sortedScaleGoal - body.sortedScale) * blend
      body.stackScale += (body.stackScaleGoal - body.stackScale) * blend
      if (body.chaos.distanceToSquared(body.chaosGoal) > 0.01 || body.sorted.distanceToSquared(body.sortedGoal) > 0.01 || body.stack.distanceToSquared(body.stackGoal) > 0.01 || Math.abs(body.stackScale - body.stackScaleGoal) > 0.0001) active = true
      const sortStart = 0.14 + body.laneIndex * 0.035 + body.rank * 0.018
      const sortT = clamp((p - sortStart) / Math.min(0.22, 0.52 - sortStart)), travel = smooth(sortT)
      const resolveT = clamp((p - 0.52 - body.laneIndex * 0.02 - body.rank * 0.006) / 0.18), resolve = ease(resolveT)
      const driftWeight = 1 - travel, phase = body.phase
      body.flight = driftWeight
      const driftX = staticFrame ? 0 : Math.sin(idleTime * (0.57 + seed(i) * 0.5) + phase) * (6 + seed(i + 4) * 8) * driftWeight
      const driftY = staticFrame ? 0 : Math.cos(idleTime * (0.57 + seed(i + 3) * 0.5) + phase) * 9 * driftWeight
      // Repulsion is applied to the cloud source only. Applying it to an
      // in-flight item sent it back above the hidden copy, over lane headings.
      const sourceProjection = distance / (distance - body.chaos.z)
      const sourceHX = (item.width + item.height * 0.18) * body.chaosScale * sourceProjection / 2 + 8
      const sourceHY = (item.height + item.width * 0.18) * body.chaosScale * sourceProjection / 2 + 8
      screenPoint.x = (body.chaos.x + driftX + body.push.x) * sourceProjection + width / 2
      screenPoint.y = height / 2 - (body.chaos.y + driftY + body.push.y) * sourceProjection
      if (p <= 0.14) constrain(screenPoint, sourceHX, sourceHY, exclusions, width, height)
      body.mesh.position.set((screenPoint.x - width / 2) / sourceProjection, (height / 2 - screenPoint.y) / sourceProjection, body.chaos.z).lerp(body.sorted, travel)
      body.mesh.position.x += (body.sorted.x - body.chaos.x) * (ease(sortT) - travel)
      body.mesh.position.x += Math.sin(sortT * Math.PI) * (i % 2 ? 14 : -14) * scale
      body.mesh.position.z += Math.sin(sortT * Math.PI) * 40
      // A single compression/rebound near touchdown is a function of progress.
      const settle = sortT > 0.82 && sortT < 1 ? Math.sin((sortT - 0.82) / 0.18 * Math.PI * 2) * 3.5 * (1 - sortT) / 0.18 : 0
      body.mesh.position.z = Math.max(item.thickness * body.sortedScale / 2, body.mesh.position.z + settle)
      body.mesh.position.lerp(body.stack, resolve)
      const desiredScale = (body.chaosScale + (body.sortedScale - body.chaosScale) * travel) * (1 - resolve) + body.stackScale * resolve
      const objectScale = desiredScale * (1 - travel * body.mesh.position.z / distance)
      body.mesh.scale.setScalar(objectScale)
      const tumble = staticFrame ? 0 : idleTime
      // Bounded, reversible idle tumble keeps edge margins/exclusions reliable.
      body.angle.set(Math.sin(tumble * 0.15 + phase) * 0.25, Math.cos(tumble * 0.19 + phase) * 0.25, Math.sin(tumble * 0.13 + phase) * 0.18)
      body.rotation.setFromEuler(body.angle); body.mesh.quaternion.copy(body.rotation).slerp(identity, travel)
      body.target.set(0, 0, 0)
      let spinTarget = 0, hoverX = 0, hoverY = 0
      if (pointerEnabled && pointerX > -9000) {
        projected.copy(body.mesh.position).project(camera)
        const sx = projected.x * width / 2, sy = projected.y * height / 2
        const dx = sx - pointerX, dy = sy - pointerY, radius = Math.hypot(dx, dy)
        if (chaosWeight > 0 && radius < 180) {
          const force = (1 - radius / 180) * chaosWeight
          const length = Math.max(1, radius)
          body.target.set(dx / length * force * 65, dy / length * force * 65, force * 30)
          spinTarget = Math.max(-0.18, Math.min(0.18, (pointerVX * dy - pointerVY * dx) * 0.0000015)) * force * recent
        } else if (!touching && p >= 0.3 && Math.abs(dx) < item.width * objectScale / 2 && Math.abs(dy) < item.height * objectScale / 2) {
          body.target.z = 7
        }
        hoverX = Math.max(-1, Math.min(1, dy / (item.height * objectScale / 2)))
        hoverY = Math.max(-1, Math.min(1, -dx / (item.width * objectScale / 2)))
      }
      // Exact critically damped nudge springs, no per-frame temporary objects.
      const springOmega = 12, springDecay = Math.exp(-springOmega * dt)
      for (let axis = 0; axis < 3; axis++) {
        const difference = body.push.getComponent(axis) - body.target.getComponent(axis)
        const velocity = body.velocity.getComponent(axis), c = velocity + springOmega * difference
        body.push.setComponent(axis, body.target.getComponent(axis) + (difference + c * dt) * springDecay)
        body.velocity.setComponent(axis, (velocity - springOmega * c * dt) * springDecay)
      }
      const spinDelta = body.spin - spinTarget, spinC = body.spinVelocity + springOmega * spinDelta
      body.spin = spinTarget + (spinDelta + spinC * dt) * springDecay
      body.spinVelocity = (body.spinVelocity - springOmega * spinC * dt) * springDecay
      body.mesh.position.z += body.push.z
      if (driftWeight > 0) {
        const projectionScale = distance / (distance - body.mesh.position.z)
        const hx = (item.width + item.height * 0.18) * objectScale * projectionScale / 2 + 8
        const hy = (item.height + item.width * 0.18) * objectScale * projectionScale / 2 + 8
        screenPoint.x = body.mesh.position.x * projectionScale + width / 2
        screenPoint.y = height / 2 - body.mesh.position.y * projectionScale
        screenPoint.x = Math.max(hx, Math.min(width - hx, screenPoint.x))
        screenPoint.y = Math.max(hy, Math.min(height - hy, screenPoint.y))
        // Desk clipping stays active during flight; copy repulsion does not.
        body.mesh.position.x = (screenPoint.x - width / 2) / projectionScale
        body.mesh.position.y = (height / 2 - screenPoint.y) / projectionScale
      }
      const hover = chaosWeight === 0 ? body.push.z / 7 : 0
      body.angle.set(hover * 0.052 * hoverX, hover * 0.052 * hoverY, body.spin + settle * 0.005 * (1 - resolve))
      tempQuaternion.setFromEuler(body.angle); body.mesh.quaternion.multiply(tempQuaternion)
      const q = body.mesh.quaternion, hx = item.width * objectScale / 2, hy = item.height * objectScale / 2
      const hz = (item.thickness / 2 + (item.type === 'pill' ? 0.85 : 0.03)) * objectScale
      body.extent.set(
        Math.abs(1 - 2 * (q.y * q.y + q.z * q.z)) * hx + Math.abs(2 * (q.x * q.y - q.z * q.w)) * hy + Math.abs(2 * (q.x * q.z + q.y * q.w)) * hz,
        Math.abs(2 * (q.x * q.y + q.z * q.w)) * hx + Math.abs(1 - 2 * (q.x * q.x + q.z * q.z)) * hy + Math.abs(2 * (q.y * q.z - q.x * q.w)) * hz,
        Math.abs(2 * (q.x * q.z - q.y * q.w)) * hx + Math.abs(2 * (q.y * q.z + q.x * q.w)) * hy + Math.abs(1 - 2 * (q.x * q.x + q.y * q.y)) * hz,
      )
      if (body.velocity.lengthSq() > 0.0001 || body.push.distanceToSquared(body.target) > 0.0001 || Math.abs(body.spinVelocity) > 0.0001) active = true
    }
    // Crossing flight paths must not cut torn paper triangles through a card.
    // Separate overlapping 3D bounds in depth, preserving projected footprints.
    // This deterministic, allocation-free pass also rewinds with progress.
    if (p > 0.14 && p < 0.52) for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j], ap = a.mesh.position, bp = b.mesh.position
        if (a.flight === 0 && b.flight === 0) continue
        if (Math.abs(ap.x - bp.x) >= a.extent.x + b.extent.x || Math.abs(ap.y - bp.y) >= a.extent.y + b.extent.y || Math.abs(ap.z - bp.z) >= a.extent.z + b.extent.z + 0.3) continue
        const upper = a.flight === 0 ? b : b.flight === 0 ? a : ap.z >= bp.z ? a : b
        const lower = upper === a ? b : a
        const oldZ = upper.mesh.position.z
        const newZ = lower.mesh.position.z + lower.extent.z + upper.extent.z + 0.3
        const compensation = (distance - newZ) / (distance - oldZ)
        upper.mesh.position.x *= compensation; upper.mesh.position.y *= compensation; upper.mesh.position.z = newZ
        upper.mesh.scale.multiplyScalar(compensation); upper.extent.multiplyScalar(compensation)
      }
    }
    if (dirty || p < 0.8 || pVelocity !== 0 || active || staticFrame) {
      renderer.render(scene, camera); dirty = false
      if (!didReady) { didReady = true; options.ready() }
    }
    // One loop remains available to observe the externally written progress ref;
    // HOLD performs no GPU work until something actually changes.
  }

  function tick(now: number) { raf = 0; if (!visible || document.hidden || contextLost || disposed) return; draw(now); raf = requestAnimationFrame(tick) }
  function wake() { if (!reducedMotion && initialized && visible && !document.hidden && !contextLost && !raf && !disposed) { lastTime = 0; raf = requestAnimationFrame(tick) } }
  function stop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0 }
  function queueMeasure() { if (!measureRaf) measureRaf = requestAnimationFrame(() => { measureRaf = 0; measure() }) }
  function pointer(event: PointerEvent) {
    const x = event.clientX - stageLeft - width / 2, y = height / 2 - (event.clientY - stageTop)
    const now = performance.now(), dt = Math.max(0.016, (now - pointerTime) / 1000)
    pointerVX = pointerX > -9000 ? (x - pointerX) / dt : 0; pointerVY = pointerY > -9000 ? (y - pointerY) / dt : 0
    pointerX = x; pointerY = y; pointerTime = now; touching = event.pointerType === 'touch'; dirty = true
  }
  function leave() { pointerX = pointerY = -10000; pointerVX = pointerVY = 0; dirty = true }
  function visibility() { if (document.hidden) stop(); else { dirty = true; if (reducedMotion) draw(performance.now(), true); else wake() } }
  function progressEvent() { if (reducedMotion && visible && !document.hidden) draw(performance.now(), true) }
  function lost(event: Event) {
    event.preventDefault(); contextLost = true; stop()
    // Detach the render-target disposal listeners while the old context is
    // lost; deleting those old GPU handles after restore produces GL errors.
    environment.dispose(); key.shadow.dispose(); key.shadow.map = null; key.shadow.mapPass = null
    lostTimer = window.setTimeout(() => { if (contextLost && !disposed) { host.style.visibility = 'hidden'; options.unavailable() } }, 4000)
  }
  function restored() {
    clearTimeout(lostTimer); contextLost = false; host.style.visibility = ''; dirty = true
    // three.js recreates its GPU resources on restore; force all owned maps to upload.
    scene.traverse(object => { if (object instanceof THREE.Mesh) {
      object.geometry.attributes.position.needsUpdate = true
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => { material.needsUpdate = true; if ('map' in material && material.map instanceof THREE.Texture) material.map.needsUpdate = true })
    } })
    environment = makeEnvironment(); scene.environment = environment.texture
    measure(); if (reducedMotion) draw(performance.now(), true); else wake()
  }
  const resizeObserver = new ResizeObserver(queueMeasure); resizeObserver.observe(stage)
  stage.querySelectorAll('[data-chaos-lane],[data-chaos-stack],[data-chaos-exclusion]').forEach(element => resizeObserver.observe(element))
  const exclusionObserver = new MutationObserver(queueExclusions)
  stage.querySelectorAll('[data-chaos-exclusion]').forEach(element => exclusionObserver.observe(element, { attributes: true, attributeFilter: ['style', 'class'], subtree: true }))
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true
    if (!visible) stop(); else { measure(); if (reducedMotion) draw(performance.now(), true); else wake() }
  }); intersectionObserver.observe(stage)
  window.addEventListener('resize', queueMeasure); window.addEventListener('scroll', scrollMeasure, { passive: true })
  stage.addEventListener('animationend', queueMeasure); document.fonts.addEventListener('loadingdone', queueMeasure)
  window.addEventListener('chaos:remeasure', queueMeasure); window.addEventListener('chaos:progress', progressEvent)
  document.addEventListener('visibilitychange', visibility)
  renderer.domElement.addEventListener('webglcontextlost', lost); renderer.domElement.addEventListener('webglcontextrestored', restored)
  if (!reducedMotion && quality === 'high') {
    window.addEventListener('pointermove', pointer, { passive: true }); window.addEventListener('pointerup', leave)
    window.addEventListener('pointerout', pointerOut); window.addEventListener('blur', leave)
  }
  function pointerOut(event: PointerEvent) { if (!event.relatedTarget) leave() }
  function disposeObject(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
    root.traverse(object => { if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry)
      const list = Array.isArray(object.material) ? object.material : [object.material]
      list.forEach(material => { materials.add(material); if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map) })
    } })
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose())
  }
  async function rebuildPalette(next: ChaosPalette) {
    const generation = ++paletteGeneration
    try {
      const family = await readyFont(next.textureFontFamily, next.textureFontFallback)
      if (disposed || generation !== paletteGeneration) return
      const first = !initialized, anisotropy = renderer.capabilities.getMaxAnisotropy()
      if (first) {
        const ranks = { fixed: 0, spending: 0, goals: 0 }
        items.filter(item => quality === 'high' || lowItems.has(item.id)).forEach((data, i) => {
          const mesh = createObject(data, paintTexture(data, family, anisotropy, next), next); scene.add(mesh)
          bodies.push({ data, mesh, rank: ranks[data.lane]++, laneIndex: lanes.indexOf(data.lane), chaos: new THREE.Vector3(), sorted: new THREE.Vector3(), stack: new THREE.Vector3(), chaosGoal: new THREE.Vector3(), sortedGoal: new THREE.Vector3(), stackGoal: new THREE.Vector3(), chaosScale: 1, sortedScale: 1, stackScale: 1, chaosScaleGoal: 1, sortedScaleGoal: 1, stackScaleGoal: 1, rotation: new THREE.Quaternion(), angle: new THREE.Euler(), phase: seed(i + 18) * Math.PI * 2, push: new THREE.Vector3(), velocity: new THREE.Vector3(), target: new THREE.Vector3(), spin: 0, spinVelocity: 0, extent: new THREE.Vector3(), flight: 0 })
        })
      } else {
        // Keep the renderer, spring state and layout when replacing themed resources.
        for (const body of bodies) {
          const old = body.mesh
          const mesh = createObject(body.data, paintTexture(body.data, family, anisotropy, next), next)
          mesh.position.copy(old.position); mesh.quaternion.copy(old.quaternion); mesh.scale.copy(old.scale)
          scene.remove(old); disposeObject(old); scene.add(mesh); body.mesh = mesh
        }
      }
      initialized = true; host.style.visibility = ''; measure(); dirty = true
      draw(performance.now(), reducedMotion)
      if (first && reducedMotion) timer = window.setInterval(() => { if (visible && !document.hidden && (p !== progress.current || dirty)) draw(performance.now(), true) }, 200)
      else wake()
    } catch { if (!disposed && generation === paletteGeneration) { host.style.visibility = 'hidden'; options.unavailable() } }
  }
  function setPalette(next: ChaosPalette) {
    const signature = JSON.stringify(next)
    if (disposed || signature === paletteSignature) return
    const blurChanged = next.environmentBlur !== palette.environmentBlur
    palette = next; paletteSignature = signature
    renderer.setClearColor(palette.clearColor, palette.clearOpacity)
    renderer.toneMappingExposure = palette.exposure; scene.environmentIntensity = palette.environmentIntensity
    key.color.set(palette.keyLightColor); key.intensity = palette.keyLightIntensity
    key.shadow.bias = palette.shadowBias; key.shadow.normalBias = palette.shadowNormalBias
    fill.color.set(palette.hemisphereSky); fill.groundColor.set(palette.hemisphereGround); fill.intensity = palette.hemisphereIntensity
    desk.material.color.set(palette.shadowColor); desk.material.opacity = palette.shadowOpacity
    if (blurChanged && !contextLost) { environment.dispose(); environment = makeEnvironment(); scene.environment = environment.texture }
    void rebuildPalette(next)
  }
  measure(); void rebuildPalette(palette)

  function dispose() {
    if (disposed) return
    disposed = true; ++paletteGeneration; stop(); cancelAnimationFrame(measureRaf); cancelAnimationFrame(exclusionRaf); clearInterval(timer); clearTimeout(lostTimer)
    resizeObserver.disconnect(); intersectionObserver.disconnect(); exclusionObserver.disconnect()
    window.removeEventListener('resize', queueMeasure); window.removeEventListener('scroll', scrollMeasure)
    stage.removeEventListener('animationend', queueMeasure); document.fonts.removeEventListener('loadingdone', queueMeasure)
    window.removeEventListener('chaos:remeasure', queueMeasure); window.removeEventListener('chaos:progress', progressEvent)
    window.removeEventListener('pointermove', pointer); window.removeEventListener('pointerup', leave); window.removeEventListener('pointerout', pointerOut); window.removeEventListener('blur', leave)
    document.removeEventListener('visibilitychange', visibility)
    renderer.domElement.removeEventListener('webglcontextlost', lost); renderer.domElement.removeEventListener('webglcontextrestored', restored)
    disposeObject(scene)
    key.shadow.dispose(); environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
  }
  return { dispose, setPalette }
}
