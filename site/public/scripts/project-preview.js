(() => {
  if (window.__cpProjectPreview) return
  window.__cpProjectPreview = true

  function init() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const rows = Array.from(document.querySelectorAll('[data-project]'))
    const preview = document.querySelector('[data-project-preview]')
    const image = preview?.querySelector('img')
    if (rows.length === 0 || !preview || !image) return

    let shown = false

    const hide = () => {
      shown = false
      preview.classList.remove('is-visible')
    }

    const place = event => {
      const offset = 24
      const rect = preview.getBoundingClientRect()
      let x = event.clientX + offset
      let y = event.clientY + offset

      if (x + rect.width > window.innerWidth - 16) x = event.clientX - rect.width - offset
      if (y + rect.height > window.innerHeight - 16) y = event.clientY - rect.height - offset

      preview.style.transform = `translate3d(${Math.max(16, x)}px, ${Math.max(16, y)}px, 0)`
    }

    for (const row of rows) {
      row.addEventListener('pointerenter', event => {
        const src = row.getAttribute('data-preview')
        if (!src) return
        if (image.getAttribute('src') !== src) image.src = src
        place(event)
        shown = true
        preview.classList.add('is-visible')
      })

      row.addEventListener('pointermove', event => {
        if (shown) place(event)
      })

      row.addEventListener('pointerleave', hide)
    }

    window.addEventListener('scroll', hide, { passive: true })
  }

  document.addEventListener('astro:page-load', init)
})()
