import type { VueWrapper } from '@vue/test-utils'

export function getCheckbox(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  const checkbox = wrapper.findAll('.ui-checkbox').find(checkbox => checkbox.text() === label)

  if (checkbox === undefined) {
    throw new Error(`No checkbox "${label}"`)
  }

  return checkbox.get<HTMLInputElement>('input')
}
