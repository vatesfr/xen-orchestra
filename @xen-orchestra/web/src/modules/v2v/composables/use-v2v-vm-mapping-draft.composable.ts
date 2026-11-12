import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import {
  useV2vVmTargets,
  type V2vVmOverrides,
  type V2vVmTargetsOptions,
} from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  getV2vOverride,
  setV2vOverride,
  V2V_DEFAULT_KEEP_MAC,
  V2V_DEFAULT_TAGS,
} from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { findV2vMigrationListVm } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { XoV2vDisk, XoV2vNic, XoV2vVm } from '@vates/types'
import { omit, omitBy } from 'lodash-es'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

// The settings of a VM are edited on a copy of its stored overrides, taken once: the stored list is never written
export function useV2vVmMappingDraft(rawVm: MaybeRefOrGetter<XoV2vVm>, { list, inventory }: V2vVmTargetsOptions) {
  const draft = ref<V2vMigrationListVm>({ ...findV2vMigrationListVm(toValue(list), toValue(rawVm).id) })

  const defaults = computed(() => toValue(list).defaults)

  // A cleared override is `undefined`: `toOverrides` leaves it out
  function updateOverrides(overrides: Partial<V2vVmOverrides>) {
    draft.value = { ...draft.value, ...overrides }
  }

  // `undefined` resets a target to its default
  function setDiskSr(key: XoV2vDisk['key'], srId: FrontXoSr['id'] | undefined) {
    updateOverrides({ disks: setV2vOverride(draft.value.disks, key, srId, defaults.value.sr) })
  }

  function setNicNetwork(key: XoV2vNic['key'], networkId: FrontXoNetwork['id'] | undefined) {
    updateOverrides({ nics: setV2vOverride(draft.value.nics, key, networkId, defaults.value.network) })
  }

  function setTemplate(templateId: FrontXoVmTemplate['id'] | undefined) {
    updateOverrides({ template: getV2vOverride(templateId, defaults.value.template) })
  }

  function setKeepMac(value: boolean) {
    updateOverrides({ keepMac: getV2vOverride(value, V2V_DEFAULT_KEEP_MAC) })
  }

  function setTags(value: string[]) {
    updateOverrides({ tags: getV2vOverride(value, V2V_DEFAULT_TAGS) })
  }

  function toOverrides(): V2vVmOverrides {
    return omitBy(omit(draft.value, 'id'), value => value === undefined)
  }

  return {
    ...useV2vVmTargets(rawVm, { list, listVm: draft, inventory }),
    setDiskSr,
    setNicNetwork,
    setTemplate,
    setKeepMac,
    setTags,
    toOverrides,
  }
}
