import type { VueWrapper } from '@vue/test-utils'

// Found by its label alone: the info a checkbox shows below is not part of it
export function getCheckbox(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  const checkbox = wrapper.findAll('.ui-checkbox .checkbox-label').find(checkbox => checkbox.text() === label)

  if (checkbox === undefined) {
    throw new Error(`No checkbox "${label}"`)
  }

  return checkbox.get<HTMLInputElement>('input')
}
