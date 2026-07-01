import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoSm } from '@vates/types'

export type FrontXoSm = Pick<XoSm, (typeof smFields)[number]>

const smFields = [
  'id',
  'name_label',
  '$pool',
  'SM_type',
  'supported_image_formats',
] as const satisfies readonly (keyof XoSm)[]

export const useXoSmCollection = defineRemoteResource({
  url: `${BASE_URL}/sms?fields=${smFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'SM', fields: smFields }),
  initialData: () => [] as FrontXoSm[],
  state: (rawSms, context) => {
    return useXoCollectionState(rawSms, {
      context,
      baseName: 'sm',
    })
  },
})
