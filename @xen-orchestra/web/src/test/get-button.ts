import type { VueWrapper } from '@vue/test-utils'

export function getButton(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  const button = wrapper.findAll('button').find(button => button.text() === label)

  if (button === undefined) {
    throw new Error(`No button "${label}"`)
  }

  return button
}
