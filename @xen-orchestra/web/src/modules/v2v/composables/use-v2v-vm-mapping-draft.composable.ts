import {
  useV2vVmMapping,
  type V2vVmMappingContext,
  type V2vVmOverrides,
} from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { findV2vMigrationListVm } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import type { XoV2vVm } from '@vates/types'
import { omit, omitBy } from 'lodash-es'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

// The settings of a VM are edited on a copy of its stored overrides, taken once: the stored list is never written
export function useV2vVmMappingDraft(rawVm: MaybeRefOrGetter<XoV2vVm>, { list }: Pick<V2vVmMappingContext, 'list'>) {
  const draft = ref<V2vMigrationListVm>({ ...findV2vMigrationListVm(toValue(list), toValue(rawVm).id) })

  const updateDraft: V2vVmMappingContext['updateVm'] = (_id, update) => {
    draft.value = update(draft.value)
  }

  // A cleared override is `undefined` in the draft: it is no override
  function toOverrides(): V2vVmOverrides {
    return omitBy(omit(draft.value, 'id'), value => value === undefined)
  }

  return {
    ...useV2vVmMapping(rawVm, { list, listVm: draft, updateVm: updateDraft }),
    toOverrides,
  }
}
