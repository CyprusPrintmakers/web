(() => {
  if (window.__cpPageMotion) return
  window.__cpPageMotion = true

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  let revealObserver

  function reveal() {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'))
    revealObserver?.disconnect()
    revealObserver = undefined

    if (elements.length === 0) {
      delete document.documentElement.dataset.reveal
      return
    }

    if (reduce() || !('IntersectionObserver' in window)) {
      for (const element of elements) element.classList.add('is-revealed')
      return
    }

    document.documentElement.dataset.reveal = 'on'
    revealObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          revealObserver?.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    for (const element of elements) revealObserver.observe(element)
  }

  function aboutPhoto() {
    const photo = document.querySelector('[data-about-photo]')
    if (!(photo instanceof HTMLElement)) return
    if (photo.dataset.state) return
    if (reduce() || !('IntersectionObserver' in window)) return

    photo.dataset.state = 'pending'

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        photo.dataset.state = 'moving'
        observer.disconnect()
      },
      { threshold: 0.2 },
    )

    observer.observe(photo)
  }

  function init() {
    reveal()
    aboutPhoto()
  }

  document.addEventListener('astro:page-load', init)
  init()
})()
