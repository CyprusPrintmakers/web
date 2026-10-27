(() => {
  const search = document.querySelector('[data-member-search]')
  const count = document.querySelector('[data-member-count]')
  const items = Array.from(document.querySelectorAll('[data-member]'))
  if (!search || !count || items.length === 0) return

  let letter = null

  const normalise = value =>
    value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/ς/g, 'σ')

  const apply = () => {
    const query = normalise(search.value.trim())
    let visible = 0

    for (const item of items) {
      const matchesQuery = query === '' || normalise(item.textContent).includes(query)
      const matchesLetter = letter === null || item.dataset.letter === letter
      const show = matchesQuery && matchesLetter
      item.hidden = !show
      if (show) visible += 1
    }

    const template =
      visible === 1 ? count.dataset.countOne || '' : count.dataset.countMany || ''
    if (template !== '') count.textContent = template.replace('{n}', String(visible))
  }

  search.addEventListener('input', apply)

  const buttons = Array.from(document.querySelectorAll('[data-letter-button]'))
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const wasActive = button.getAttribute('aria-pressed') === 'true'
      letter = wasActive ? null : button.getAttribute('data-letter')
      for (const other of buttons) {
        other.setAttribute(
          'aria-pressed',
          String(!wasActive && other === button),
        )
      }
      apply()
    })
  }
})()
