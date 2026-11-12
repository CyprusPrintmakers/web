(() => {
  if (window.__cpHeaderMenu) return
  window.__cpHeaderMenu = true

  const panelFor = toggle => {
    const id = toggle.getAttribute('aria-controls')
    const panel = id ? document.getElementById(id) : null
    return panel instanceof HTMLElement ? panel : null
  }

  const setOpen = (toggle, panel, open, focus) => {
    panel.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    if (!focus) return
    if (open) {
      panel.querySelector('a, button')?.focus()
    } else {
      toggle.focus()
    }
  }

  document.addEventListener('click', event => {
    const target = event.target
    if (!(target instanceof Element)) return

    const toggle = target.closest('[data-menu-toggle]')
    if (toggle instanceof HTMLButtonElement) {
      const panel = panelFor(toggle)
      if (!panel) return
      event.preventDefault()
      setOpen(toggle, panel, panel.hidden, true)
      return
    }

    const openPanel = target.closest('[data-menu-panel]')
    if (!openPanel) {
      for (const panel of document.querySelectorAll('[data-menu-panel]:not([hidden])')) {
        if (!(panel instanceof HTMLElement)) continue
        const button = document.querySelector(`[data-menu-toggle][aria-controls="${panel.id}"]`)
        if (button instanceof HTMLButtonElement) setOpen(button, panel, false, false)
      }
      return
    }

    // A link closes the menu; the theme button inside it does not.
    if (target.closest('a') && openPanel instanceof HTMLElement) {
      const button = document.querySelector(`[data-menu-toggle][aria-controls="${openPanel.id}"]`)
      if (button instanceof HTMLButtonElement) setOpen(button, openPanel, false, false)
    }
  })

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return
    for (const panel of document.querySelectorAll('[data-menu-panel]:not([hidden])')) {
      if (!(panel instanceof HTMLElement)) continue
      const button = document.querySelector(`[data-menu-toggle][aria-controls="${panel.id}"]`)
      if (button instanceof HTMLButtonElement) setOpen(button, panel, false, true)
    }
  })
})()
