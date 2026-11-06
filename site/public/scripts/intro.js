(() => {
  const root = document.querySelector('[data-home-intro]')
  const html = document.documentElement
  if (window.__cpIntroTimeout) clearTimeout(window.__cpIntroTimeout)
  if (!root || html.dataset.intro !== 'pending' || root.dataset.introRan) return

  const [button, stage, ghost, lead, tail, body] = [
    '.intro__enter', '.intro__stage', '[data-intro-ghost]',
    '.hero-brand__lead', '.hero-brand__tail', '[data-hero-intro-body]',
  ].map(selector => root.querySelector(selector))
  const hero = document.querySelector('[data-hero-lockup]')
  const main = document.querySelector('main#main')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const isEl = element => element instanceof HTMLElement

  let effects = [], started = false, skipping = false, cleaned = false
  let hold, focusTimer

  const focus = () => {
    try {
      if (!isEl(main)) return
      main.focus({ preventScroll: true })
    } catch {}
  }

  const done = () => {
    if (cleaned) return
    cleaned = true
    clearTimeout(watchdog)
    clearTimeout(hold)
    clearTimeout(focusTimer)
    reduce.removeEventListener('change', onReduce)
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
    layout?.disconnect()
    for (const animation of effects) {
      try {
        animation.cancel()
      } catch {}
    }
    delete html.dataset.intro
    root.remove()
    focus()
    try {
      window.dispatchEvent(new CustomEvent('cp:intro-done'))
    } catch {}
  }

  const play = (element, frames, options) => {
    const animation = element.animate(frames, { ...options, fill: 'both' })
    effects.push(animation)
    return animation
  }

  const onReduce = event => {
    if (!event.matches) return
    done()
    focusTimer = setTimeout(focus, 100)
  }
  const onKey = event => { if (event.key === 'Escape') skip() }
  const onResize = () => { if (!started && !cleaned) centre() }
  let watchdog
  let layout
  reduce.addEventListener('change', onReduce)

  const reveal = () => {
    if (cleaned) return
    try {
      html.dataset.intro = 'revealing'
      root.style.pointerEvents = 'none'

      const chrome = [
        document.querySelector('.header'),
        document.querySelector('.home-cover__links'),
        document.querySelector('.page footer'),
      ].filter(isEl)

      const fade = play(root, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 300, easing: 'ease-out',
      })
      const chromeFade = Promise.all(
        chrome.map(element =>
          play(element, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 500, delay: 80, easing: 'ease-out',
          }).finished,
        ),
      )

      Promise.all([fade.finished, chromeFade]).then(done, done)
    } catch { done() }
  }

  const anchorY = () =>
    innerWidth < 900 && innerHeight >= 640 ? innerHeight * 0.32 : innerHeight / 2

  const centredLeft = desired => {
    const width = stage.offsetWidth
    const margin = 16
    const maxLeft = Math.max(margin, innerWidth - width - margin)
    return Math.min(Math.max(desired, margin), maxLeft)
  }

  const centre = () => {
    if (!isEl(stage)) return
    const mark = stage.querySelector('.hero-brand__mark')
    if (!isEl(mark)) return
    stage.style.transform = 'none'
    stage.style.left = `${centredLeft(innerWidth / 2 - mark.offsetLeft - mark.offsetWidth / 2)}px`
    stage.style.top = `${anchorY() - mark.offsetTop - mark.offsetHeight / 2}px`
  }

  const skip = () => {
    if (cleaned) return
    if (!started) return done()
    if (skipping) return
    skipping = true
    try {
      for (const animation of effects) animation.finish()
      reveal()
    } catch { done() }
  }

  const start = async () => {
    if (started || cleaned) return
    started = true
    watchdog = setTimeout(done, 15000)
    try {
      if (![stage, ghost, lead, tail, hero].every(isEl)) return done()
      html.dataset.intro = 'moving'
      stage.style.cssText += ';position:fixed;left:0;top:0;transform:none'
      const heroRect = hero.getBoundingClientRect()
      if (!heroRect.width || !heroRect.height) return done()
      stage.style.width = `${heroRect.width}px`

      const stageRect = stage.getBoundingClientRect()
      const mark = stage.querySelector('.hero-brand__mark')
      if (!stageRect.width || !isEl(mark)) return done()
      const startLeft = centredLeft(innerWidth / 2 - mark.offsetLeft - mark.offsetWidth / 2)
      const startTop = anchorY() - mark.offsetTop - mark.offsetHeight / 2
      stage.style.left = `${startLeft}px`
      stage.style.top = `${startTop}px`

      if (isEl(body)) {
        const gutter = 24
        const tailRect = tail.getBoundingClientRect()
        body.style.left = `${innerWidth < 900 ? gutter : tailRect.left}px`
        body.style.top = `${innerWidth < 900 ? startTop + stage.offsetHeight + 16 : tailRect.bottom + 24}px`
        body.style.width = 'max-content'
        body.style.maxWidth = `${innerWidth - (innerWidth < 900 ? gutter * 2 : tailRect.left + gutter)}px`
      }

      ghost.style.left = `${mark.offsetLeft}px`
      ghost.style.top = `${mark.offsetTop}px`
      ghost.style.width = `${mark.offsetWidth}px`
      ghost.style.height = `${mark.offsetHeight}px`

      const easing = getComputedStyle(html).getPropertyValue('--ease-out-expo').trim() || 'ease-out'
      play(ghost,
        [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(120px)', opacity: 0 }],
        { duration: 300, easing: 'ease-out' },
      )
      for (const [index, line] of [lead, tail].entries()) play(line,
        [{ opacity: 0, transform: `translateX(${index ? 24 : -24}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 500, easing },
      )

      const hasBody = isEl(body) && body.textContent.trim().length > 0
      let paragraph
      if (hasBody) {
        paragraph = play(body,
          [
            { opacity: 0, clipPath: 'inset(0 0 100% 0)', offset: 0 },
            { opacity: 0, clipPath: 'inset(0 0 100% 0)', offset: 600 / 9100 },
            { opacity: 1, clipPath: 'inset(0)', offset: 2600 / 9100 },
            { opacity: 1, clipPath: 'inset(0)', offset: 7100 / 9100 },
            { opacity: 0, clipPath: 'inset(100% 0 0 0)', offset: 1 },
          ],
          { duration: 9100, easing: 'ease-out' },
        )
        paragraph.finished.then(() => { if (!cleaned) body.style.visibility = 'hidden' }, done)
      }

      if (hasBody && paragraph) await paragraph.finished
      if (cleaned || skipping) return
      html.dataset.intro = 'handoff'
      await new Promise(resolve => { hold = setTimeout(resolve, 120) })
      if (!cleaned && !skipping) reveal()
    } catch { done() }
  }

  if (!isEl(button)) return done()
  button.addEventListener('click', () => started ? skip() : start())
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  root.dataset.introRan = '1'

  try {
    centre()
    requestAnimationFrame(() => { if (!started && !cleaned) centre() })
    if ('ResizeObserver' in window) {
      layout = new ResizeObserver(() => { if (!started && !cleaned) centre() })
      layout.observe(stage)
    }
  } catch { done() }
  document.fonts?.ready.then(onResize).catch(done)
})()
