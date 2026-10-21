import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolDestinationChoices } from '@/modules/v2v/composables/use-v2v-pool-destination-choices.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { useV2vVmLabels, type V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import type { V2vSelectedVmCheck } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vVmMapping } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import {
  getV2vMappingSummary,
  getV2vSelectedVmState,
  V2V_READINESS_LEVELS,
  type V2vMappingTargetNameGetters,
} from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { countOccurrences } from '@/shared/utils/count.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import type { XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

// What the VMs step owns: the panel reads the same list and rows, never instances of its own
export type V2vSelectedVmsContext = {
  migrationList: Pick<ReturnType<typeof useV2vMigrationList>, 'list' | 'removeVm' | 'clearVms'>
  rows: MaybeRefOrGetter<V2vVmRow[]>
  areRowsReady: MaybeRefOrGetter<boolean>
  poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
}

export type V2vSelectedVm = {
  id: XoV2vVm['id']
  name: string
  kind: V2vAccentedLabel<TagAccent>
  mappingParts: string[]
  check: V2vAccentedLabel<InfoAccent>
  mappingRoute: RouteLocationRaw
}

export type V2vListLock = {
  sourceHost?: string
  poolName?: string
  isLocked: boolean
}

export function useV2vSelectedVms({ migrationList, rows, areRowsReady, poolId }: V2vSelectedVmsContext) {
  const { t } = useI18n()

  const { getKindTag, getCheckInfo, getMappingParts, getReadinessTags } = useV2vVmLabels()

  const { getStepLocation } = useV2vWizardNavigation()

  const { open: openConfirmModal } = useDeleteModal()

  const { getPoolById } = useXoPoolCollection()

  const { getSrById } = useXoSrCollection()

  const { getNetworkById } = useXoNetworkCollection()

  const offers = useV2vPoolDestinationChoices(poolId)

  const { sourceHost, poolName } = useV2vSourceAndDestination(poolId)

  const rowsById = computed(() => new Map(toValue(rows).map(row => [row.id, row])))

  // The list may outlive a VM of the inventory: its id is all that is left to name it
  function getName(id: XoV2vVm['id']) {
    return rowsById.value.get(id)?.name ?? id
  }

  const targetNameGetters: V2vMappingTargetNameGetters = {
    getSrName: id => getSrById(id)?.name_label,
    getNetworkName: id => getNetworkById(id)?.name_label,
  }

  const selectedVms = computed(() => {
    const list = migrationList.list.value

    if (list === undefined) {
      return []
    }

    return list.vms.map(listVm => {
      const row = rowsById.value.get(listVm.id)
      const { kind, check } = getV2vSelectedVmState(row, toValue(poolId))
      const mapping = row === undefined ? undefined : getV2vVmMapping(row.vm, listVm, list.defaults, offers.value)

      return { id: listVm.id, kind, check, mapping: getV2vMappingSummary(mapping, kind, targetNameGetters) }
    })
  })

  // Only a partial import on another pool names a pool
  function getCheckPoolName(check: V2vSelectedVmCheck) {
    return check.type === 'partial-on-other-pool' ? getPoolById(check.poolId)?.name_label : undefined
  }

  const items = computed(() =>
    selectedVms.value.map(
      ({ id, kind, check, mapping }): V2vSelectedVm => ({
        id,
        name: getName(id),
        kind: getKindTag(kind),
        mappingParts: getMappingParts(mapping),
        check: getCheckInfo(check, getCheckPoolName(check)),
        mappingRoute: getStepLocation('mapping', { vm: id }),
      })
    )
  )

  const count = computed(() => selectedVms.value.length)

  const isEmpty = computed(() => count.value === 0)

  // Until the rows are ready, the import state of a VM is unknown: a warm one would read as new and ready
  const isBusy = computed(() => !toValue(areRowsReady))

  const readinessTags = computed(() => {
    const levels = selectedVms.value.map(selectedVm => selectedVm.check.level)

    return getReadinessTags(countOccurrences(V2V_READINESS_LEVELS, levels))
  })

  const lockSummary = computed(
    (): V2vListLock => ({ sourceHost: sourceHost.value, poolName: poolName.value, isLocked: !isEmpty.value })
  )

  // One confirmation for removing one VM or all of them: either way, only the list changes
  async function confirmListChange(subject: string, confirmLabel: string) {
    const { event } = await openConfirmModal({
      props: { subject, confirmLabel, description: t('v2v:remove-from-list-info') },
    })

    return event === 'onConfirm'
  }

  async function remove(id: XoV2vVm['id']) {
    const isConfirmed = await confirmListChange(
      t('v2v:name-from-migration-list', { name: getName(id) }),
      t('action:remove')
    )

    if (isConfirmed) {
      migrationList.removeVm(id)
    }
  }

  async function clear() {
    const isConfirmed = await confirmListChange(
      t('v2v:name-from-migration-list', { name: t('n-vms', { n: count.value }) }),
      t('action:clear')
    )

    if (isConfirmed) {
      migrationList.clearVms()
    }
  }

  return { items, count, isEmpty, isBusy, readinessTags, lockSummary, remove, clear }
}
