(() => {
  const forms = Array.from(document.querySelectorAll('form[data-form]'))
  if (forms.length === 0) return

  const successEn = 'Thank you — your submission has been sent.'
  const successEl = 'Ευχαριστούμε — η υποβολή σας στάλθηκε.'

  for (const form of forms) {
    const renderedAt = form.querySelector('[data-rendered-at]')
    if (renderedAt instanceof HTMLInputElement) renderedAt.value = String(Date.now())

    // The server returns JSON with field errors; native HTML5 validation
    // would double up with them.
    form.setAttribute('novalidate', '')

    form.addEventListener('submit', async event => {
      event.preventDefault()

      const button = form.querySelector('button[type="submit"]')
      const status = form.querySelector('[data-form-status]')
      if (button instanceof HTMLButtonElement) button.disabled = true

      for (const slot of form.querySelectorAll('[data-error]')) slot.textContent = ''
      if (status) status.hidden = true

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        })
        const payload = await response.json()

        if (payload.ok) {
          const lang = document.documentElement.lang
          const message = lang === 'el' ? successEl : successEn
          if (status instanceof HTMLElement) {
            status.textContent = message
            status.hidden = false
          }
          form.reset()
        } else if (payload.errors) {
          for (const [field, message] of Object.entries(payload.errors)) {
            const slot = form.querySelector(`[data-error="${field}"]`)
            if (slot) slot.textContent = String(message)
          }
        }
      } catch {
        if (status instanceof HTMLElement) {
          status.textContent =
            document.documentElement.lang === 'el'
              ? 'Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.'
              : 'Something went wrong. Please try again.'
          status.hidden = false
        }
      } finally {
        if (button instanceof HTMLButtonElement) button.disabled = false
      }
    })
  }
})()
