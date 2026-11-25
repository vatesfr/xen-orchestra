import VtsProgressBarGroupWithStates from '@core/components/progress-bar-group-with-states/VtsProgressBarGroupWithStates.vue'
import type { VueWrapper } from '@vue/test-utils'

// The state each `VtsProgressBarGroupWithStates` is handed, which picks its loader, its state hero or its bars
export function findProgressBarGroupStates(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(VtsProgressBarGroupWithStates).map(group => ({
    busy: group.props('busy'),
    hasError: group.props('hasError'),
    itemCount: group.props('items').length,
  }))
}
