import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import type { XoVmTemplate } from '@/types/xo/vm-template.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export const useXoVmTemplateCollection = defineRemoteResource({
  url: '/rest/v0/vm-templates?fields=id,uuid,name_label,name_description,$pool,template_info,VIFs,$VBDs,boot,CPUs,memory,tags,isDefaultTemplate',
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
