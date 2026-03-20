import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoVmTemplate } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { ref, watch } from 'vue'

export type FrontXoVmTemplate = Pick<XoVmTemplate, (typeof vmTemplateFields)[number]>

const vmTemplateFields = [
  'id',
  'uuid',
  'name_label',
  'name_description',
  '$pool',
  'template_info',
  'VIFs',
  '$VBDs',
  'boot',
  'CPUs',
  'memory',
  'tags',
  'isDefaultTemplate',
  'type',
  'bios_strings',
  'secureBoot',
] as const satisfies readonly (keyof XoVmTemplate)[]

export const useXoVmTemplateCollection = defineRemoteResource({
  url: `${BASE_URL}/vm-templates?fields=${vmTemplateFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VM-template', fields: vmTemplateFields }),
  initialData: () => [] as FrontXoVmTemplate[],
  state: (rawTemplates, context) => {
    const sortedTemplates = useSorted(rawTemplates, sortByNameLabel)

    const vmsTemplatesByPool = ref(new Map<FrontXoPool['id'], FrontXoVmTemplate[]>())

    watch(sortedTemplates, templates => {
      const tmpTemplatesByPool = new Map<FrontXoPool['id'], FrontXoVmTemplate[]>()

      templates.forEach(template => {
        safePushInMap(tmpTemplatesByPool, template.$pool, template)
      })

      vmsTemplatesByPool.value = tmpTemplatesByPool
    })

    return {
      ...useXoCollectionState(sortedTemplates, {
        context,
        baseName: 'template',
      }),
      vmsTemplatesByPool,
    }
  },
})
