import UiButton from '@core/components/ui/button/UiButton.vue'
import type { VueWrapper } from '@vue/test-utils'

// A component or any element of it, a table cell for instance
type ButtonContainer = Pick<VueWrapper, 'findAllComponents'>

export function findButtonByLabel(wrapper: ButtonContainer, label: string) {
  return wrapper.findAllComponents(UiButton).find(button => button.text() === label)
}

export function getButtonByLabel(wrapper: ButtonContainer, label: string) {
  const button = findButtonByLabel(wrapper, label)

  if (button === undefined) {
    throw new Error(`No button labelled "${label}"`)
  }

  return button
}
