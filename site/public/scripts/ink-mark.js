(() => {
  if (window.__cpInk) return
  window.__cpInk = true

  const HOST = '[data-ink-hero]'
  const STATE_KEY = '__cpInkState'
  const LIVE = 0.02
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  // Splits a text element into per-line runs. Per-character rects are the only
  // reliable way to know where a wrapped line starts, and the hero title can
  // wrap to two lines on very narrow screens.
  function textRuns(element) {
    const node = element.firstChild
    if (!node || node.nodeType !== Node.TEXT_NODE) return []
    const text = node.textContent
    if (!text || !text.trim()) return []
    const range = document.createRange()
    const runs = []
    let current = null
    for (let i = 0; i < text.length; i += 1) {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rect = range.getBoundingClientRect()
      if (!rect.width && !rect.height) continue
      const top = Math.round(rect.top)
      if (!current || Math.abs(current.top - top) > 2) {
        current = {
          top,
          left: rect.left,
          right: rect.right,
          height: rect.height,
          text: text[i],
        }
        runs.push(current)
      } else {
        current.left = Math.min(current.left, rect.left)
        current.right = Math.max(current.right, rect.right)
        current.height = Math.max(current.height, rect.height)
        current.text += text[i]
      }
    }
    return runs
  }

  function init() {
    const host = document.querySelector(HOST)
    if (!(host instanceof HTMLElement)) return
    const canvas = host.querySelector('[data-ink-canvas]')
    const brand = host.querySelector('.hero-brand')
    const mark = host.querySelector('.hero-brand__mark')
    if (!(canvas instanceof HTMLCanvasElement)) return
    if (!(brand instanceof HTMLElement) || !(mark instanceof HTMLImageElement)) return

    const roller = document.querySelector('[data-ink-roller]')
    if (new URLSearchParams(location.search).get('ink') === 'off') {
      host.dataset.inkEnabled = '0'
      canvas.dataset.inkDisabled = '1'
      canvas.style.display = 'none'
      if (roller instanceof HTMLElement) roller.style.display = 'none'
      return
    }
    if (reduce.matches) return
    if (canvas.dataset.inkInit) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    canvas.dataset.inkInit = '1'
    host.dataset.inkEnabled = '1'

    // A brayer follows the pointer on desktop. The native cursor is only
    // suppressed after the first successful placement, so a script failure
    // leaves the crosshair in place.
    if (roller instanceof HTMLElement && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let cursorOn = false
      const place = event => {
        if (event.pointerType === 'touch') return
        const rect = canvas.getBoundingClientRect()
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        roller.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
        roller.dataset.visible = inside ? '1' : '0'
        if (inside && !cursorOn) {
          cursorOn = true
          canvas.dataset.inkCustomCursor = '1'
        }
      }
      canvas.addEventListener('pointerenter', place)
      canvas.addEventListener('pointermove', place)
      canvas.addEventListener('pointerleave', () => {
        roller.dataset.visible = '0'
        delete roller.dataset.pressing
      })
      canvas.addEventListener('pointerdown', () => { roller.dataset.pressing = '1' })
      canvas.addEventListener('pointerup', () => { delete roller.dataset.pressing })
      canvas.addEventListener('pointercancel', () => { delete roller.dataset.pressing })
    }

    const ready = () => {
      if (!canvas.isConnected) return
      const fonts = document.fonts?.ready ?? Promise.resolve()
      const image =
        mark.complete && mark.naturalWidth > 0
          ? Promise.resolve()
          : new Promise(resolve => {
              mark.addEventListener('load', resolve, { once: true })
              mark.addEventListener('error', resolve, { once: true })
            })
      Promise.all([fonts, image]).then(() => {
        if (canvas.isConnected) begin()
      })
    }

    function begin() {
      const hostRect = host.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()
      if (!hostRect.width || !hostRect.height) return
      if (!canvasRect.width || !canvasRect.height) return

      // Match the device pixel grid on high-DPI screens (capped at 2x) so the
      // thin title strokes and the mark's grey layers stay crisp, with a cell
      // budget for slower machines. The grid follows the canvas box, so the
      // visible overhang is controlled entirely by the CSS around it.
      const MAX_CELLS = 1000000
      const resolution = clamp(window.devicePixelRatio || 1, 1, 2)
      let W = Math.round(canvasRect.width * resolution)
      let H = Math.round(canvasRect.height * resolution)
      const shrink = Math.sqrt(MAX_CELLS / (W * H))
      if (shrink < 1) {
        W = Math.round(W * shrink)
        H = Math.round(H * shrink)
      }
      if (W < 2 || H < 2) return
      canvas.width = W
      canvas.height = H
      const cellW = canvasRect.width / W
      const cellH = canvasRect.height / H
      const cellScale = 1 / cellW

      const target = new Float32Array(W * H)
      const tone = new Uint8ClampedArray(W * H)

      function readTarget() {
        const scale = 2
        const hi = document.createElement('canvas')
        hi.width = W * scale
        hi.height = H * scale
        const paint = hi.getContext('2d', { willReadFrequently: true })
        if (!paint) return false
        paint.scale(scale, scale)

        paint.translate(
          (hostRect.left - canvasRect.left) / cellW,
          (hostRect.top - canvasRect.top) / cellH,
        )
        paint.scale(1 / cellW, 1 / cellH)

        // The logo is drawn as-is. Text is always black here; the canvas is
        // inverted by CSS in dark mode, exactly like the static lockup.
        const markRect = mark.getBoundingClientRect()
        paint.drawImage(
          mark,
          markRect.left - hostRect.left,
          markRect.top - hostRect.top,
          markRect.width,
          markRect.height,
        )

        paint.fillStyle = '#000'
        paint.textAlign = 'left'
        paint.textBaseline = 'middle'
        for (const selector of ['.hero-brand__lead', '.hero-brand__tail']) {
          const element = host.querySelector(selector)
          if (!(element instanceof HTMLElement)) continue
          const style = getComputedStyle(element)
          paint.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
          if ('letterSpacing' in paint) paint.letterSpacing = style.letterSpacing
          const runs = textRuns(element)
          if (!runs.length) {
            const rect = element.getBoundingClientRect()
            paint.fillText(
              element.textContent.trim(),
              rect.left - hostRect.left,
              rect.top - hostRect.top + rect.height / 2,
            )
            continue
          }
          for (const run of runs) {
            const leading = run.text.match(/^\s+/)?.[0] ?? ''
            const text = run.text.trim()
            if (!text) continue
            paint.fillText(
              text,
              run.left - hostRect.left + paint.measureText(leading).width,
              run.top - hostRect.top + run.height / 2,
            )
          }
        }

        const off = document.createElement('canvas')
        off.width = W
        off.height = H
        const flat = off.getContext('2d', { willReadFrequently: true })
        if (!flat) return false
        flat.drawImage(hi, 0, 0, W, H)
        const data = flat.getImageData(0, 0, W, H).data
        for (let i = 0; i < target.length; i += 1) {
          target[i] = data[i * 4 + 3] / 255
          tone[i] = data[i * 4]
        }
        return true
      }

      if (!readTarget()) return

      const titleKey = `${W}x${H}:${brand.textContent?.trim() ?? ''}`
      const stored = window[STATE_KEY]
      let height
      let vx
      let vy
      let restored = false
      if (stored && stored.w === W && stored.h === H && stored.title === titleKey) {
        height = stored.height
        vx = stored.vx
        vy = stored.vy
        restored = true
      } else {
        height = new Float32Array(W * H)
        vx = new Float32Array(W * H)
        vy = new Float32Array(W * H)
        window[STATE_KEY] = { w: W, h: H, title: titleKey, height, vx, vy }
      }
      // Fade displaced ink out as it leaves the lockup and before it reaches
      // the canvas edge. Target pixels keep their full alpha, so the title and
      // mark are never clipped; the spill blends into the paper instead.
      let minX = W
      let maxX = 0
      let minY = H
      let maxY = 0
      for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
          if (target[y * W + x] <= 0.02) continue
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
      if (minX > maxX || minY > maxY) return

      const mask = new Float32Array(W * H)
      const spread = Math.max(
        8,
        Math.round(Math.min(maxX - minX + 1, maxY - minY + 1) * 0.5),
      )
      const edgeFeather = Math.max(8, Math.round(Math.min(W, H) * 0.15))
      for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
          const i = y * W + x
          if (target[i] > 0.02) {
            mask[i] = 1
            continue
          }
          const dx = Math.max(minX - x, 0, x - maxX)
          const dy = Math.max(minY - y, 0, y - maxY)
          const out = clamp(1 - Math.hypot(dx, dy) / spread, 0, 1)
          const spill = out * out * (3 - 2 * out)
          const edge = Math.min(x, W - 1 - x, y, H - 1 - y)
          const inside = clamp(edge / edgeFeather, 0, 1)
          const rim = inside * inside * (3 - 2 * inside)
          mask[i] = Math.min(spill, rim)
        }
      }
      let next = new Float32Array(W * H)
      let raf = 0
      let stirring = false
      let lastX = 0
      let lastY = 0
      let peak = 1
      let ready = false

      const sample = (array, x, y) => {
        const sx = clamp(x, 0, W - 1)
        const sy = clamp(y, 0, H - 1)
        const x0 = Math.floor(sx)
        const y0 = Math.floor(sy)
        const x1 = Math.min(x0 + 1, W - 1)
        const y1 = Math.min(y0 + 1, H - 1)
        const fx = sx - x0
        const fy = sy - y0
        const a = array[y0 * W + x0]
        const b = array[y0 * W + x1]
        const c = array[y1 * W + x0]
        const d = array[y1 * W + x1]
        return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
      }

      const imageData = ctx.createImageData(W, H)
      const pixels = imageData.data

      function step() {
        for (let y = 0; y < H; y += 1) {
          for (let x = 0; x < W; x += 1) {
            const i = y * W + x
            const h = sample(height, x - vx[i] * 0.55, y - vy[i] * 0.55)
            // While the pointer is down the ink is free to move; the lockup
            // only starts pulling itself back together on release.
            next[i] = h + (target[i] - h) * (stirring ? 0 : 0.007)
            vx[i] *= 0.93
            vy[i] *= 0.93
          }
        }

        const swap = height
        height = next
        next = swap
        if (window[STATE_KEY]) window[STATE_KEY].height = height

        peak = 0
        for (let i = 0; i < height.length; i += 1) {
          const delta = Math.abs(clamp(height[i], 0, 1) - target[i])
          if (delta > peak) peak = delta
        }
      }

      function render() {
        for (let y = 0; y < H; y += 1) {
          for (let x = 0; x < W; x += 1) {
            const i = y * W + x
            const h = height[i]
            const p = i * 4
            if (h < 0.02) {
              pixels[p + 3] = 0
              continue
            }
            const left = height[y * W + Math.max(0, x - 1)]
            const right = height[y * W + Math.min(W - 1, x + 1)]
            const up = height[Math.max(0, y - 1) * W + x]
            const down = height[Math.min(H - 1, y + 1) * W + x]
            const slope = Math.abs(right - left) + Math.abs(down - up)
            // Only displaced ink catches the light; at rest the field must
            // match the lockup exactly, or thin strokes turn grey.
            const excited = clamp(Math.abs(h - target[i]) * 4, 0, 1)
            // The logo is multi-tone; keep its greys at rest. Displaced ink
            // stays dark and only catches a little light, so the smear reads
            // as ink on the paper rather than a white embossed band.
            const base = target[i] > 0.02 ? tone[i] : 14
            const value = clamp(base + slope * 70 * excited, 0, 225)
            pixels[p] = value
            pixels[p + 1] = value
            pixels[p + 2] = value
            pixels[p + 3] = Math.round(clamp(h, 0, 1) * mask[i] * 255)
          }
        }
        ctx.putImageData(imageData, 0, 0)
      }

      function tick() {
        if (!canvas.isConnected) {
          raf = 0
          return
        }
        step()
        render()
        const visible = peak > LIVE || stirring
        brand.style.opacity = visible ? '0' : '1'
        canvas.style.opacity = visible ? '1' : '0'
        if (visible) {
          raf = requestAnimationFrame(tick)
        } else {
          raf = 0
        }
      }

      function start() {
        if (!raf) raf = requestAnimationFrame(tick)
      }

      function disturb(px, py, dx, dy) {
        const radius = Math.max(6, Math.round(18 * cellScale))
        for (let y = Math.floor(py - radius); y <= py + radius; y += 1) {
          if (y < 1 || y >= H - 1) continue
          for (let x = Math.floor(px - radius); x <= px + radius; x += 1) {
            if (x < 1 || x >= W - 1) continue
            const distance = Math.hypot(x - px, y - py)
            if (distance > radius) continue
            const falloff = 1 - distance / radius
            const i = y * W + x
            vx[i] = clamp(vx[i] + dx * falloff * 1.2, -6, 6)
            vy[i] = clamp(vy[i] + dy * falloff * 1.2, -6, 6)
            height[i] = Math.min(1.6, height[i] + falloff * 0.12)
          }
        }
      }

      const point = event => {
        const rect = canvas.getBoundingClientRect()
        return {
          x: ((event.clientX - rect.left) / rect.width) * W,
          y: ((event.clientY - rect.top) / rect.height) * H,
        }
      }

      const native = event => event.pointerType !== 'touch'

      canvas.addEventListener('pointerdown', event => {
        if (!ready) return
        if (native(event)) event.preventDefault()
        try {
          canvas.setPointerCapture(event.pointerId)
        } catch {}
        stirring = true
        const p = point(event)
        lastX = p.x
        lastY = p.y
        disturb(p.x, p.y, 0, 0)
        start()
      })

      canvas.addEventListener('pointermove', event => {
        if (!stirring || !ready) return
        if (native(event)) event.preventDefault()
        const p = point(event)
        const limit = 7 * cellScale
        const dx = clamp(p.x - lastX, -limit, limit)
        const dy = clamp(p.y - lastY, -limit, limit)
        lastX = p.x
        lastY = p.y
        disturb(p.x, p.y, dx, dy)
        start()
      })

      const release = () => {
        stirring = false
        start()
      }
      canvas.addEventListener('pointerup', release)
      canvas.addEventListener('pointercancel', release)

      // A fresh field starts settled; a restored one may still be relaxing.
      if (!restored) {
        for (let i = 0; i < target.length; i += 1) height[i] = target[i]
      }

      peak = 0
      for (let i = 0; i < height.length; i += 1) {
        const delta = Math.abs(clamp(height[i], 0, 1) - target[i])
        if (delta > peak) peak = delta
      }
      const visible = peak > LIVE
      brand.style.opacity = visible ? '0' : '1'
      canvas.style.opacity = visible ? '1' : '0'
      ready = true
      canvas.dataset.ready = '1'
      canvas.dataset.inkActive = '1'
      if (visible) start()
    }

    ready()
  }

  const hideInk = () => {
    const host = document.querySelector(HOST)
    if (!(host instanceof HTMLElement)) return
    host.dataset.inkEnabled = '0'
    const canvas = host.querySelector('[data-ink-canvas]')
    if (canvas instanceof HTMLCanvasElement) {
      canvas.dataset.inkDisabled = '1'
      canvas.style.display = 'none'
    }
    const roller = document.querySelector('[data-ink-roller]')
    if (roller instanceof HTMLElement) roller.style.display = 'none'
  }

  const settingEnabled = async () => {
    const host = document.querySelector(HOST)
    const fallback = host instanceof HTMLElement && host.dataset.inkDefault !== 'off'
    try {
      const response = await fetch('/api/ink', { cache: 'no-store' })
      if (!response.ok) return fallback
      const body = await response.json()
      return body.enabled !== false
    } catch {
      return fallback
    }
  }

  const start = () => {
    if (!document.querySelector(HOST)) return
    if (new URLSearchParams(location.search).get('ink') === 'off') {
      hideInk()
      return
    }
    settingEnabled().then(enabled => {
      if (enabled) init()
      else hideInk()
    })
  }

  const startWhenReady = () => {
    if (document.documentElement.dataset.intro) {
      window.addEventListener('cp:intro-done', start, { once: true })
    } else {
      start()
    }
  }

  document.addEventListener('astro:page-load', startWhenReady)
  startWhenReady()
})()
