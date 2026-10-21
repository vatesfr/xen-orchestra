import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { VueWrapper } from '@vue/test-utils'

// A component or any element of it, a table cell for instance
type ButtonContainer = Pick<VueWrapper, 'findAllComponents'>

function getFound<TButton>(button: TButton | undefined, description: string): TButton {
  if (button === undefined) {
    throw new Error(`No ${description}`)
  }

  return button
}

export function findButtonByLabel(wrapper: ButtonContainer, label: string) {
  return wrapper.findAllComponents(UiButton).find(button => button.text() === label)
}

export function getButtonByLabel(wrapper: ButtonContainer, label: string) {
  return getFound(findButtonByLabel(wrapper, label), `button labelled "${label}"`)
}

// An icon button has no text: its accessible name is its label
export function getButtonIconByLabel(wrapper: ButtonContainer, label: string) {
  const button = wrapper
    .findAllComponents(UiButtonIcon)
    .find(buttonIcon => buttonIcon.attributes('aria-label') === label)

  return getFound(button, `icon button labelled "${label}"`)
}
