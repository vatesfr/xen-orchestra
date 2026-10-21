import UiButton from '@core/components/ui/button/UiButton.vue'
import type { VueWrapper } from '@vue/test-utils'

export function findButtonByLabel(wrapper: VueWrapper, label: string) {
  return wrapper.findAllComponents(UiButton).find(button => button.text() === label)
}

export function getButtonByLabel(wrapper: VueWrapper, label: string) {
  const button = findButtonByLabel(wrapper, label)

  if (button === undefined) {
    throw new Error(`No button labelled "${label}"`)
  }

  return button
}
