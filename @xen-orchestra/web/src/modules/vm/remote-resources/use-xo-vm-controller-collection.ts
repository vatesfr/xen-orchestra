import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { useWatchCollection } from '@core/composables/watch-collection.composable.ts'
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
  url: `${BASE_URL}/vm-controllers?fields=${vmControllerFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VM-controller', fields: vmControllerFields }),
  initialData: () => [] as XoVmController[],
  state: (vmControllers, context) =>
    useXoCollectionState(vmControllers, {
      context,
      baseName: 'vmController',
    }),
})
