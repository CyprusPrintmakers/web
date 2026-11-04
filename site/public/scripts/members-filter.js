(() => {
  if (window.__cpMembersFilter) return
  window.__cpMembersFilter = true

  function init() {
    const count = document.querySelector('[data-member-count]')
    const items = Array.from(document.querySelectorAll('[data-member]'))
    if (!count || items.length === 0) return

    let letter = null

    const apply = () => {
      let visible = 0

      for (const item of items) {
        const show = letter === null || item.dataset.letter === letter
        item.hidden = !show
        if (show) visible += 1
      }

      const template =
        visible === 1 ? count.dataset.countOne || '' : count.dataset.countMany || ''
      if (template !== '') count.textContent = template.replace('{n}', String(visible))
    }

    const buttons = Array.from(document.querySelectorAll('[data-letter-button]'))
    for (const button of buttons) {
      button.addEventListener('click', () => {
        const wasActive = button.getAttribute('aria-pressed') === 'true'
        letter = wasActive ? null : button.getAttribute('data-letter')
        for (const other of buttons) {
          other.setAttribute('aria-pressed', String(!wasActive && other === button))
        }
        apply()
      })
    }
  }

  document.addEventListener('astro:page-load', init)
})()
