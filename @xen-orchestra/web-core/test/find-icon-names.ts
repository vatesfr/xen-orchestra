import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { VueWrapper } from '@vue/test-utils'

// The name of each `VtsIcon` a wrapper renders, in order
export function findIconNames(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(VtsIcon).map(icon => icon.props('name'))
}
