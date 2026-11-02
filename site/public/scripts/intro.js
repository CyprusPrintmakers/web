(() => {
  const root = document.querySelector('[data-home-intro]')
  const html = document.documentElement
  if (!root || html.dataset.intro !== 'pending' || root.dataset.introRan) return

  const stage = root.querySelector('.intro__stage')
  const clone = root.querySelector('.intro__stage .brand')
  const ghost = root.querySelector('[data-intro-ghost]')
  const real = document.querySelector('header .brand')
  const lines = Array.from(root.querySelectorAll('[data-brand-line]'))

  let animations = []
  let cleaned = false

  function cleanup() {
    if (cleaned) return
    cleaned = true
    if (window.__cpIntroTimeout) clearTimeout(window.__cpIntroTimeout)
    delete html.dataset.intro
    root.remove()
    try {
      sessionStorage.setItem('cp:intro', '1')
    } catch {}
  }

  function skip() {
    for (const animation of animations) {
      try {
        animation.finish()
      } catch {}
    }
    cleanup()
  }

  // Install the skip listeners before marking the run, so the attribute is a
  // reliable signal that Escape works.
  document.addEventListener('keydown', skip, { once: true })
  root.addEventListener('click', skip, { once: true })
  root.dataset.introRan = '1'

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cleanup()
    return
  }

  if (
    !(stage instanceof HTMLElement) ||
    !(clone instanceof HTMLElement) ||
    !(ghost instanceof HTMLImageElement) ||
    !(real instanceof HTMLElement) ||
    lines.length !== 2
  ) {
    cleanup()
    return
  }

  try {
    // Constrain the clone to the header's available width before measuring so
    // its wordmark wraps exactly like the real one at every viewport.
    const available =
      real.parentElement instanceof HTMLElement
        ? real.parentElement.clientWidth
        : document.documentElement.clientWidth
    if (available > 0) stage.style.width = `${available}px`

    // Natural size at the stage origin, then centre it at 1x so the scaled
    // start state stays centred rather than growing from the top-left.
    stage.style.position = 'fixed'
    stage.style.left = '0px'
    stage.style.top = '0px'
    stage.style.transform = 'none'

    const natural = clone.getBoundingClientRect()
    if (!natural.width || !natural.height) {
      cleanup()
      return
    }

    stage.style.left = `${(window.innerWidth - natural.width) / 2}px`
    stage.style.top = `${(window.innerHeight - natural.height) / 2}px`

    const cloneRect = clone.getBoundingClientRect()
    const realRect = real.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    const mark = clone.querySelector('.brand__mark')
    if (!realRect.width || !realRect.height || !(mark instanceof HTMLImageElement)) {
      cleanup()
      return
    }

    const markRect = mark.getBoundingClientRect()

    // The ghost is a child of the stage, so these are pre-transform offsets.
    ghost.style.left = `${markRect.left - stageRect.left}px`
    ghost.style.top = `${markRect.top - stageRect.top}px`
    ghost.style.width = `${markRect.width}px`
    ghost.style.height = `${markRect.height}px`
    ghost.style.opacity = '1'

    const fit = Math.min(
      (window.innerWidth - 48) / cloneRect.width,
      (window.innerHeight - 48) / cloneRect.height,
    )
    const startScale = Math.max(1, Math.min(1.6, fit))
    const startLeft = cloneRect.left - (cloneRect.width * (startScale - 1)) / 2
    const startTop = cloneRect.top - (cloneRect.height * (startScale - 1)) / 2

    stage.style.left = `${startLeft}px`
    stage.style.top = `${startTop}px`
    stage.style.transform = `scale(${startScale})`
    stage.style.opacity = '1'
    html.dataset.intro = 'moving'

    const easing =
      getComputedStyle(html).getPropertyValue('--ease-out-expo').trim() ||
      'cubic-bezier(0.16, 1, 0.3, 1)'

    const ghostAnimation = ghost.animate(
      [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(120px)', opacity: 0 },
      ],
      { duration: 320, easing: 'ease-out', fill: 'both' },
    )

    const lineAnimations = lines.map((line, index) =>
      line.animate(
        [
          { opacity: 0, transform: `translateX(${index === 0 ? -24 : 24}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: 600, delay: index * 60, easing, fill: 'both' },
      ),
    )

    const dx = realRect.left - startLeft
    const dy = realRect.top - startTop
    const endScale = realRect.width / cloneRect.width

    const move = stage.animate(
      [
        { transform: `scale(${startScale})` },
        { transform: `translate(${dx}px, ${dy}px) scale(${endScale})` },
      ],
      { duration: 500, delay: 400, easing, fill: 'both' },
    )

    animations = [ghostAnimation, ...lineAnimations, move]

    move.finished
      .then(() => {
        if (cleaned) return
        html.dataset.intro = 'handoff'

        // Hold hand-off for a few frames so the aligned clone and real brand
        // are observable before the overlay fades.
        return new Promise(resolve => setTimeout(resolve, 120))
      })
      .then(() => {
        if (cleaned) return
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
        if (cleaned) return
        root.remove()
        setTimeout(cleanup, 80)
      })
      .catch(() => {})
  } catch {
    cleanup()
  }
})()