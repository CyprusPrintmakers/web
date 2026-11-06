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
    if (reduce.matches) return
    if (canvas.dataset.inkInit) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    canvas.dataset.inkInit = '1'

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
      if (!hostRect.width || !hostRect.height) return

      // Roughly one grid cell per rendered pixel so the thin title strokes
      // survive the ink render, with a cell budget for slower machines. The
      // canvas covers 120% of the lockup, so the title lives in the middle
      // 1/12 margin on each side.
      const MAX_CELLS = 180000
      let W = Math.round(hostRect.width * 1.2)
      let H = Math.round(W * (hostRect.height / hostRect.width))
      const shrink = Math.sqrt(MAX_CELLS / (W * H))
      if (shrink < 1) W = Math.round(W * shrink)
      W = clamp(W, 160, 960)
      H = Math.max(48, Math.round(W * (hostRect.height / hostRect.width)))
      canvas.width = W
      canvas.height = H
      const cellScale = ((W * 5) / 6) / hostRect.width

      const target = new Float32Array(W * H)

      function readTarget() {
        const scale = 2
        const hi = document.createElement('canvas')
        hi.width = W * scale
        hi.height = H * scale
        const paint = hi.getContext('2d', { willReadFrequently: true })
        if (!paint) return false
        paint.scale(scale, scale)

        const content = (W * 5) / 6
        const s = content / hostRect.width
        paint.translate(W / 12, H / 12)
        paint.scale(s, s)

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
            next[i] = h + (target[i] - h) * 0.007
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
            // match the black lockup exactly, or thin strokes turn grey.
            const excited = clamp(Math.abs(h - target[i]) * 4, 0, 1)
            const value = clamp(8 + slope * 190 * excited, 6, 235)
            pixels[p] = value
            pixels[p + 1] = value
            pixels[p + 2] = value
            pixels[p + 3] = Math.round(clamp(h, 0, 1) * 255)
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
      if (visible) start()
    }

    ready()
  }

  const startWhenReady = () => {
    if (document.documentElement.dataset.intro) {
      window.addEventListener('cp:intro-done', init, { once: true })
    } else {
      init()
    }
  }

  document.addEventListener('astro:page-load', startWhenReady)
  startWhenReady()
})()
