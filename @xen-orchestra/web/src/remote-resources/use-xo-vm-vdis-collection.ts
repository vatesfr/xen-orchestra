import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'
import { computed } from 'vue'

export const useXoVmVdisCollection = defineRemoteResource({
  url: (vmId: string) =>
    `/rest/v0/vms/${vmId}/vdis?fields=id,name_label,name_description,usage,size,uuid,tags,cbt_enabled,$VBDs,$SR,image_format`,
  initialData: () => [] as XoVdi[],
  state: (vmVdis, context) => {
    const { getVbdsByIds } = useXoVbdCollection(context)

    const notCdDriveVbds = computed(() =>
      vmVdis.value.filter(vdi => {
        const vbds = getVbdsByIds(vdi.$VBDs ?? [])

        return vbds.some(vbd => !vbd.is_cd_drive)
      })
    )

    return {
      ...useXoCollectionState(vmVdis, {
        context,
        baseName: 'vmVdi',
      }),
      notCdDriveVbds,
    }
  },
})
