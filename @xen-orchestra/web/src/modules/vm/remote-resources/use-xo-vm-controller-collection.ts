import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVmController } from '@vates/types'

export type FrontXoVmController = Pick<XoVmController, (typeof vmControllerFields)[number]>

const vmControllerFields = [
  'id',
  'name_label',
  'power_state',
  'memory',
  '$container',
  'type',
] as const satisfies readonly (keyof XoVmController)[]

export const useXoVmControllerCollection = defineRemoteResource({
  url: `${BASE_URL}/vm-controllers?fields=${vmControllerFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VM-controller', fields: vmControllerFields }),
  initialData: () => [] as Pick<XoVmController, (typeof vmControllerFields)[number]>[],
  state: (vmControllers, context) =>
    useXoCollectionState(vmControllers, {
      context,
      baseName: 'vmController',
    }),
})
