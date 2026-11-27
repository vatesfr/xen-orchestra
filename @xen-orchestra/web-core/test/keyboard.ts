type PressOptions = KeyboardEventInit & { target?: EventTarget | null }

// The label of the focused element: its `aria-label`, else its text; `undefined` when no element has the focus
export function getFocusedLabel() {
  const activeElement = document.activeElement

  if (activeElement === null || activeElement === document.body) {
    return undefined
  }

  return activeElement.getAttribute('aria-label') ?? activeElement.textContent
}

// Presses `key` on the focused element (or on `target`); returns the event, to check whether it was prevented
export function press(key: string, { target = document.activeElement, ...options }: PressOptions = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })

  target?.dispatchEvent(event)

  return event
}
