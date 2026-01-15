import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { useWatchCollection } from '@core/composables/watch-collection.composable.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoPool, XoVmTemplate } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

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
] as const satisfies readonly (keyof XoVmTemplate)[]

export const useXoVmTemplateCollection = defineRemoteResource({
  url: `${BASE_URL}/vm-templates?fields=${vmTemplateFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VM-template', fields: vmTemplateFields }),
  initialData: () => [] as FrontXoVmTemplate[],
  state: (rawTemplates, context) => {
    const templates = useSorted(rawTemplates, sortByNameLabel)

    const vmsTemplatesByPool = computed(() => {
      const vmTemplatesByPoolMap = new Map<XoPool['id'], FrontXoVmTemplate[]>()

      templates.value.forEach(template => {
        const poolId = template.$pool

        if (!vmTemplatesByPoolMap.has(poolId)) {
          vmTemplatesByPoolMap.set(poolId, [])
        }

        vmTemplatesByPoolMap.get(poolId)!.push(template)
      })

      return vmTemplatesByPoolMap
    })

    return {
      ...useXoCollectionState(templates, {
        context,
        baseName: 'template',
      }),
      vmsTemplatesByPool,
    }
  },
})
