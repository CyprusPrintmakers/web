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
    for (const animation of effects) {
      try {
        animation.cancel()
      } catch {}
    }
    delete html.dataset.intro
    root.remove()
    focus()
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
  reduce.addEventListener('change', onReduce)

  const reveal = () => {
    if (cleaned) return
    try {
      html.dataset.intro = 'revealing'
      root.style.pointerEvents = 'none'
      const fade = play(root, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 300, easing: 'ease-out',
      })
      fade.finished.then(done, done)
    } catch { done() }
  }

  const centre = () => {
    if (!isEl(stage)) return
    const mark = stage.querySelector('.hero-brand__mark')
    if (!isEl(mark)) return
    stage.style.transform = 'none'
    stage.style.left = `${innerWidth / 2 - mark.offsetLeft - mark.offsetWidth / 2}px`
    stage.style.top = `${innerHeight / 2 - mark.offsetTop - mark.offsetHeight / 2}px`
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
      const startLeft = innerWidth / 2 - mark.offsetLeft - mark.offsetWidth / 2
      const startTop = innerHeight / 2 - mark.offsetTop - mark.offsetHeight / 2
      stage.style.left = `${startLeft}px`
      stage.style.top = `${startTop}px`
      stage.style.cssText += `--intro-body-x:${tail.offsetLeft}px;--intro-body-y:${tail.offsetTop + tail.offsetHeight + 24}px;--intro-body-width:${innerWidth - startLeft - tail.offsetLeft - 24}px`

      ghost.style.left = `${mark.offsetLeft}px`
      ghost.style.top = `${mark.offsetTop}px`
      ghost.style.width = `${mark.offsetWidth}px`
      ghost.style.height = `${mark.offsetHeight}px`

      const dx = heroRect.left - startLeft
      const dy = heroRect.top - startTop
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
      if (hasBody) {
        const paragraph = play(body,
          [
            { opacity: 0, clipPath: 'inset(0 0 100% 0)', offset: 0 },
            { opacity: 0, clipPath: 'inset(0 0 100% 0)', offset: 600 / 6100 },
            { opacity: 1, clipPath: 'inset(0)', offset: 2600 / 6100 },
            { opacity: 1, clipPath: 'inset(0)', offset: 4100 / 6100 },
            { opacity: 0, clipPath: 'inset(100% 0 0 0)', offset: 1 },
          ],
          { duration: 6100, easing: 'ease-out' },
        )
        paragraph.finished.then(() => { if (!cleaned) body.style.visibility = 'hidden' }, done)
      }

      const move = play(stage,
        [{ transform: 'scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${heroRect.width / stageRect.width})` }],
        { duration: 300, delay: hasBody ? 6100 : 600, easing },
      )
      await move.finished
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

  try { centre() } catch { done() }
  document.fonts?.ready.then(onResize).catch(done)
})()
