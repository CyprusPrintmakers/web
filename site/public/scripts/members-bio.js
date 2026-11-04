(() => {
  if (window.__cpMemberBio) return
  window.__cpMemberBio = true

  function init() {
    for (const summary of document.querySelectorAll('.members__entry > summary')) {
      summary.addEventListener('click', event => {
        const target = event.target
        const link = target instanceof Element ? target.closest('a') : null
        if (!link) return

        // A link inside the row must not also toggle the disclosure.
        event.preventDefault()
        window.location.href = link.getAttribute('href') ?? ''
      })
    }

    if (location.hash.startsWith('#member-')) {
      const entry = document.querySelector(location.hash)
      if (entry instanceof HTMLDetailsElement) {
        entry.open = true
        entry.scrollIntoView({ block: 'start' })
      }
    }
  }

  document.addEventListener('astro:page-load', init)
})()
