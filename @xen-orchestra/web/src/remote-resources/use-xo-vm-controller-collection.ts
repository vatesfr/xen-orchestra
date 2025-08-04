import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoVmController } from '@/types/xo/vm-controller.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoVmControllerCollection = defineRemoteResource({
  url: '/rest/v0/vm-controllers?fields=id,name_label,power_state,memory,$container',
  initialData: () => [] as XoVmController[],
  state: (vmControllers, context) =>
    useXoCollectionState(vmControllers, {
      context,
      baseName: 'vmController',
    }),
})
