import type { VueWrapper } from '@vue/test-utils'

export function findInputLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-label').map(label => label.text())
}
