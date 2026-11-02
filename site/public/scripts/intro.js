(() => {
  const root = document.querySelector('[data-home-intro]')
  const html = document.documentElement

  // The head gate's fail-safe timer must never outlive a working module.
  if (window.__cpIntroTimeout) clearTimeout(window.__cpIntroTimeout)

  if (!root || html.dataset.intro !== 'pending' || root.dataset.introRan) return

  const button = root.querySelector('.intro__enter')
  const stage = root.querySelector('.intro__stage')
  const ghost = root.querySelector('[data-intro-ghost]')
  const lead = root.querySelector('.hero-brand__lead')
  const tail = root.querySelector('.hero-brand__tail')
  const body = root.querySelector('[data-hero-intro-body]')
  const hero = document.querySelector('[data-hero-lockup]')
  const main = document.querySelector('main#main')

  let animations = []
  let started = false
  let skipping = false
  let cleaned = false

  function focusMain() {
    try {
      if (main instanceof HTMLElement) main.focus({ preventScroll: true })
    } catch {}
  }

  function cleanup() {
    if (cleaned) return
    cleaned = true
    delete html.dataset.intro
    root.remove()
  }

  function skip() {
    if (cleaned) return
    if (!started) {
      // Nothing animated yet: reveal the page immediately.
      cleanup()
      return
    }
    if (skipping) return
    skipping = true
    for (const animation of animations) {
      try {
        animation.finish()
      } catch {}
    }
    html.dataset.intro = 'revealing'
    root.style.pointerEvents = 'none'
    const fade = root.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 300, easing: 'ease-out', fill: 'both' },
    )
    animations.push(fade)
    fade.finished
      .then(() => {
        if (cleaned) return
        cleanup()
        focusMain()
      })
      .catch(() => {})
  }

  function start() {
    if (started || cleaned) return
    started = true

    if (
      !(stage instanceof HTMLElement) ||
      !(ghost instanceof HTMLImageElement) ||
      !(lead instanceof HTMLElement) ||
      !(tail instanceof HTMLElement) ||
      !(hero instanceof HTMLElement)
    ) {
      cleanup()
      return
    }

    try {
      html.dataset.intro = 'moving'

      // Constrain the overlay stage to the real hero's rendered width (not
      // its parent) so the wordmark wraps exactly like the h1 at every
      // viewport, then centre the logo mark at 1x.
      stage.style.position = 'fixed'
      stage.style.left = '0px'
      stage.style.top = '0px'
      stage.style.transform = 'none'

      const heroRect = hero.getBoundingClientRect()
      if (!heroRect.width || !heroRect.height) {
        cleanup()
        return
      }
      stage.style.width = `${heroRect.width}px`

      const stageRect = stage.getBoundingClientRect()
      const mark = stage.querySelector('.hero-brand__mark')
      if (!stageRect.width || !stageRect.height || !(mark instanceof HTMLElement)) {
        cleanup()
        return
      }

      const markRect = mark.getBoundingClientRect()
      const startLeft =
        window.innerWidth / 2 - markRect.width / 2 - (markRect.left - stageRect.left)
      const startTop =
        window.innerHeight / 2 - markRect.height / 2 - (markRect.top - stageRect.top)
      stage.style.left = `${startLeft}px`
      stage.style.top = `${startTop}px`

      // The ghost is a child of the stage, so these are pre-transform offsets.
      ghost.style.left = `${markRect.left - stageRect.left}px`
      ghost.style.top = `${markRect.top - stageRect.top}px`
      ghost.style.width = `${markRect.width}px`
      ghost.style.height = `${markRect.height}px`

      const dx = heroRect.left - startLeft
      const dy = heroRect.top - startTop
      const endScale = heroRect.width / stageRect.width

      const easing =
        getComputedStyle(html).getPropertyValue('--ease-out-expo').trim() ||
        'cubic-bezier(0.16, 1, 0.3, 1)'

      const ghostAnimation = ghost.animate(
        [
          { transform: 'translateX(0)', opacity: 1 },
          { transform: 'translateX(120px)', opacity: 0 },
        ],
        { duration: 300, easing: 'ease-out', fill: 'both' },
      )

      const lineAnimations = [lead, tail].map((line, index) =>
        line.animate(
          [
            { opacity: 0, transform: `translateX(${index === 0 ? -24 : 24}px)` },
            { opacity: 1, transform: 'translateX(0)' },
          ],
          { duration: 500, easing, fill: 'both' },
        ),
      )

      animations = [ghostAnimation, ...lineAnimations]

      const hasBody = body instanceof HTMLElement && body.textContent.trim().length > 0
      if (hasBody) {
        const reveal = body.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 2000, delay: 600, easing, fill: 'both' },
        )
        const fade = body.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 2000, delay: 4100, easing, fill: 'both' },
        )
        animations.push(reveal, fade)
        fade.finished
          .then(() => {
            if (!cleaned) body.style.visibility = 'hidden'
          })
          .catch(() => {})
      }

      const move = stage.animate(
        [
          { transform: 'scale(1)' },
          { transform: `translate(${dx}px, ${dy}px) scale(${endScale})` },
        ],
        { duration: 300, delay: hasBody ? 6100 : 600, easing, fill: 'both' },
      )
      animations.push(move)

      move.finished
        .then(() => {
          if (cleaned || skipping) return
          html.dataset.intro = 'handoff'

          // Hold the aligned lockup for a few frames so it is observable
          // before the overlay fades.
          return new Promise(resolve => setTimeout(resolve, 120))
        })
        .then(() => {
          if (cleaned || skipping) return
          html.dataset.intro = 'revealing'
          root.style.pointerEvents = 'none'

          const fade = root.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 300, easing: 'ease-out', fill: 'both' },
          )
          animations.push(fade)
          return fade.finished
        })
        .then(() => {
          if (cleaned || skipping) return
          cleanup()
          focusMain()
        })
        .catch(() => {})
    } catch {
      cleanup()
    }
  }

  // Install the listeners before marking the run, so the attribute is a
  // reliable signal that Enter and Escape work. The first click starts; a
  // later click or Escape skips.
  if (!(button instanceof HTMLElement)) {
    cleanup()
    return
  }
  button.addEventListener('click', () => {
    if (!started) start()
    else skip()
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') skip()
  })
  root.dataset.introRan = '1'
})()
