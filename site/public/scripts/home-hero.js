(() => {
  if (window.__cpHomeHero) return
  window.__cpHomeHero = true

  function align() {
    const hero = document.querySelector('[data-ink-hero]')
    const mark = hero?.querySelector('.hero-brand__mark')
    if (!(hero instanceof HTMLElement) || !(mark instanceof HTMLElement)) return

    // Measure from the untransformed layout, then centre the mark where the
    // intro cover leaves it, clamped so the lockup never leaves the viewport.
    hero.style.transform = 'none'
    void hero.offsetWidth

    const rect = hero.getBoundingClientRect()
    const markRect = mark.getBoundingClientRect()
    const anchorY =
      window.innerWidth < 1200 && window.innerHeight >= 640
        ? window.innerHeight * 0.32
        : window.innerWidth >= 1200 && window.innerHeight < 900
          ? window.innerHeight * 0.42
          : window.innerHeight / 2
    const dx = window.innerWidth / 2 - (markRect.left + markRect.width / 2)
    const dy = anchorY - (markRect.top + markRect.height / 2)
    const margin = 16
    const clampedDx = Math.max(margin - rect.left, Math.min(dx, window.innerWidth - margin - rect.right))

    hero.style.transform = `translate(${clampedDx}px, ${dy}px)`
  }

  align()
  document.addEventListener('astro:page-load', align)
  window.addEventListener('resize', align)
  document.fonts?.ready.then(align)
})()
