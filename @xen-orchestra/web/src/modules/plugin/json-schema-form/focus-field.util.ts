// fields are reached by ID as the router uses the URL hash, which prevents anchor links
export function focusField(id: string) {
  const element = document.getElementById(id)

  element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  element?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true })
}
