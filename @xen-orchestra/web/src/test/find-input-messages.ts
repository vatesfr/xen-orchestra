import type { VueWrapper } from '@vue/test-utils'

export function findInputMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.text())
}
