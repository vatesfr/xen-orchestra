import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoPool, XoVmTemplate } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

const vmTemplateFields: (keyof XoVmTemplate)[] = [
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
] as const

export const useXoVmTemplateCollection = defineRemoteResource({
  url: `/rest/v0/vm-templates?fields=${vmTemplateFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VM-template', fields: vmTemplateFields }),
  initialData: () => [] as XoVmTemplate[],
  state: (rawTemplates, context) => {
    const templates = useSorted(rawTemplates, sortByNameLabel)

    const vmsTemplatesByPool = computed(() => {
      const vmTemplatesByPoolMap = new Map<XoPool['id'], XoVmTemplate[]>()

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
