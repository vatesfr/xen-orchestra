import UiButton from '@core/components/ui/button/UiButton.vue'
import type { VueWrapper } from '@vue/test-utils'

// By its accessible name: its text, or its `aria-label` for an icon button, which has no text
export function findButton(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  return wrapper.findAll('button').find(button => (button.text() || button.attributes('aria-label')) === label)
}

export function getButton(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  const button = findButton(wrapper, label)

  if (button === undefined) {
    throw new Error(`No button "${label}"`)
  }

  return button
}

export function getUiButton(wrapper: Pick<VueWrapper, 'findAllComponents'>, label: string) {
  const button = wrapper.findAllComponents(UiButton).find(button => button.text() === label)

  if (button === undefined) {
    throw new Error(`No UiButton "${label}"`)
  }

  return button
}
