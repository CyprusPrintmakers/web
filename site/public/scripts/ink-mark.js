(() => {
  if (window.__cpInk) return
  window.__cpInk = true

  const W = 220
  const H = 212
  const STATE_KEY = '__cpInkState'
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  function init() {
    const host = document.querySelector('[data-ink-mark]')
    const canvas = host?.querySelector('[data-ink-canvas]')
    const image = host?.querySelector('.ink-mark__image')
    if (!(host instanceof HTMLElement)) return
    if (!(canvas instanceof HTMLCanvasElement) || !(image instanceof HTMLImageElement)) return
    if (reduce.matches) return
    if (canvas.dataset.inkInit) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    canvas.dataset.inkInit = '1'

    const target = new Float32Array(W * H)
    const tone = new Uint8ClampedArray(W * H)

    function readTarget() {
      const off = document.createElement('canvas')
      off.width = W
      off.height = H
      const offCtx = off.getContext('2d', { willReadFrequently: true })
      if (!offCtx) return false
      // The canvas is 150% of the mark; the ink sits in the middle and can
      // spread into the surrounding margin.
      const drawW = (W * 2) / 3
      const drawH = (H * 2) / 3
      offCtx.drawImage(image, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH)
      const data = offCtx.getImageData(0, 0, W, H).data
      for (let i = 0; i < target.length; i += 1) {
        const alpha = data[i * 4 + 3] / 255
        target[i] = alpha
        tone[i] = data[i * 4]
      }
      return true
    }

    const state = window[STATE_KEY]
    let height
    let vx
    let vy
    if (state && state.w === W && state.h === H) {
      height = state.height
      vx = state.vx
      vy = state.vy
    } else {
      height = new Float32Array(W * H)
      vx = new Float32Array(W * H)
      vy = new Float32Array(W * H)
      window[STATE_KEY] = { w: W, h: H, height, vx, vy }
    }
    let next = new Float32Array(W * H)
    let raf = 0
    let stirring = false
    let lastX = 0
    let lastY = 0
    let activity = 1
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

      let diff = 0
      let total = 0
      for (let i = 0; i < height.length; i += 1) {
        diff += Math.abs(height[i] - target[i])
        total += target[i]
      }
      activity = clamp((diff / Math.max(total, 1)) * 16, 0, 1)
      image.style.opacity = String(1 - activity)
      canvas.style.opacity = String(activity)
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
          const light = clamp(0.5 - (right - left + down - up) * 1.8, 0.15, 1)
          const base = tone[i] > 8 ? tone[i] : 30
          const value = clamp(base * 0.72 + light * 54, 8, 235)
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
      if (activity > 0.004 || stirring) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
        image.style.opacity = '1'
        canvas.style.opacity = '0'
      }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    function disturb(px, py, dx, dy) {
      const radius = 10
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

    canvas.addEventListener('pointerdown', event => {
      if (!ready) return
      event.preventDefault()
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
      event.preventDefault()
      const p = point(event)
      const dx = clamp(p.x - lastX, -4, 4)
      const dy = clamp(p.y - lastY, -4, 4)
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

    function begin() {
      if (!image.complete || image.naturalWidth === 0) {
        image.addEventListener('load', begin, { once: true })
        return
      }
      if (!readTarget()) return
      ready = true
      canvas.dataset.ready = '1'

      // A restored state may still be settling when the visitor returns.
      if (!window.__cpInkStateInitialised) {
        for (let i = 0; i < target.length; i += 1) {
          if (height[i] === 0 && target[i] > 0) height[i] = target[i]
        }
        window.__cpInkStateInitialised = true
      }

      let diff = 0
      let total = 0
      for (let i = 0; i < height.length; i += 1) {
        diff += Math.abs(height[i] - target[i])
        total += target[i]
      }
      activity = clamp((diff / Math.max(total, 1)) * 16, 0, 1)
      image.style.opacity = String(1 - activity)
      canvas.style.opacity = String(activity)
      if (activity > 0.004) start()
    }

    begin()
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
