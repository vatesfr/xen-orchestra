import UiButton from '@core/components/ui/button/UiButton.vue'
import type { VueWrapper } from '@vue/test-utils'

export function getButton(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  const button = wrapper.findAll('button').find(button => button.text() === label)

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
