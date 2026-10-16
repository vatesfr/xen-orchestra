const FIELD_SELECTOR = 'input, textarea'

export function focusField(id: string) {
  const element = document.getElementById(id)

  if (element === null) {
    return
  }

  element.scrollIntoView({ block: 'center', behavior: 'smooth' })

  const field = element.matches(FIELD_SELECTOR) ? element : element.querySelector<HTMLElement>(FIELD_SELECTOR)

  field?.focus({ preventScroll: true })
}
