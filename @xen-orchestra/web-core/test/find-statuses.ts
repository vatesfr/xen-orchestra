import VtsStatus from '@core/components/status/VtsStatus.vue'
import type { VueWrapper } from '@vue/test-utils'

// The status each `VtsStatus` of the wrapper shows, in order
export function findStatuses(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return (wrapper.findAllComponents(VtsStatus) as VueWrapper<InstanceType<typeof VtsStatus>>[]).map(status =>
    status.props('status')
  )
}
