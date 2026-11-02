(() => {
  if (window.__cpProjectsFilter) return
  window.__cpProjectsFilter = true

  function init() {
  const buttons = Array.from(document.querySelectorAll('[data-year-button]'))
  const items = Array.from(document.querySelectorAll('[data-project]'))
  if (buttons.length === 0 || items.length === 0) return

  const apply = year => {
    for (const item of items) {
      item.hidden = year !== '' && item.dataset.year !== year
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const other of buttons) {
        other.setAttribute('aria-pressed', String(other === button))
      }
      apply(button.getAttribute('data-year') || '')
    })
  }
  }

  document.addEventListener('astro:page-load', init)
})()
