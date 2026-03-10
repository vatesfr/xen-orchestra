import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoSm } from '@vates/types'
import { computed } from 'vue'

export type FrontXoSm = Pick<XoSm, (typeof smFields)[number]>

const smFields = ['id', 'SM_type', 'supported_image_formats'] as const satisfies readonly (keyof XoSm)[]

// TODO: remove mock once https://github.com/xapi-project/xen-api/pull/6712 is merged
const MOCK_SUPPORTED_FORMATS: Record<string, string[]> = {
  ext: ['vhd', 'qcow2'],
  nfs: ['vhd', 'qcow2'],
  smb: ['vhd', 'qcow2'],
  lvmoiscsi: ['vhd'],
  lvmohba: ['vhd'],
  lvm: ['vhd'],
  iso: [],
  udev: [],
}

export const useXoSmCollection = defineRemoteResource({
  url: `${BASE_URL}/sms?fields=${smFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'SM', fields: smFields }),
  initialData: () => [] as FrontXoSm[],
  state: (sms, context) => {
    const state = useXoCollectionState(sms, {
      context,
      baseName: 'sm',
    })

    const smBySrType = computed(() => {
      const map = new Map<string, FrontXoSm>()

      sms.value.forEach(sm => {
        const formats =
          sm.supported_image_formats.length > 0
            ? sm.supported_image_formats
            : (MOCK_SUPPORTED_FORMATS[sm.SM_type] ?? [])

        map.set(sm.SM_type, { ...sm, supported_image_formats: formats })
      })

      return map
    })

    return {
      ...state,
      smBySrType,
    }
  },
})
