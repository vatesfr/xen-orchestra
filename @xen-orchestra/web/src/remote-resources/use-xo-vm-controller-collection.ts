import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVmController } from '@vates/types'

const vmControllerFields: (keyof XoVmController)[] = [
  'id',
  'name_label',
  'power_state',
  'memory',
  '$container',
  'type',
] as const

export const useXoVmControllerCollection = defineRemoteResource({
  url: `/rest/v0/vm-controllers?fields=${vmControllerFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VM-controller', fields: vmControllerFields }),
  initialData: () => [] as XoVmController[],
  state: (vmControllers, context) =>
    useXoCollectionState(vmControllers, {
      context,
      baseName: 'vmController',
    }),
})
