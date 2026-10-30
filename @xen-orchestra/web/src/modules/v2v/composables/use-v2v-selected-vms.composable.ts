import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolDestinationChoices } from '@/modules/v2v/composables/use-v2v-pool-destination-choices.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { useV2vTargetNameGetters } from '@/modules/v2v/composables/use-v2v-target-name-getters.composable.ts'
import { useV2vVmLabels, type V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import type {
  V2vMappingSummary,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vVmMapping } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import {
  getV2vMappingSummary,
  getV2vSelectedVmState,
  V2V_READINESS_LEVELS,
} from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { countOccurrences } from '@/shared/utils/count.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import type { XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

// What the step owns: the panel reads the same list and rows, never instances of its own. The mapping step selects
// one VM of the list at most
export type V2vSelectedVmsContext = {
  migrationList: Pick<ReturnType<typeof useV2vMigrationList>, 'list' | 'removeVm' | 'clearVms'>
  rows: MaybeRefOrGetter<V2vVmRow[]>
  areRowsReady: MaybeRefOrGetter<boolean>
  poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
  selectedVmId?: MaybeRefOrGetter<XoV2vVm['id'] | undefined>
}

export type V2vSelectedVm = {
  id: XoV2vVm['id']
  name: string
  kind?: V2vAccentedLabel<TagAccent>
  mappingParts: string[]
  check: V2vAccentedLabel<InfoAccent>
  mappingRoute: RouteLocationRaw
  isSelected: boolean
}

export type V2vSelectedVmsPanelProps = {
  items: V2vSelectedVm[]
  count: number
  isEmpty: boolean
  isBusy: boolean
  readinessTags: V2vAccentedLabel<TagAccent>[]
  listPair: V2vListPair
}

// A VM of the list, as the mapping step tells it apart, with its item of the panel
export type V2vListedVm = {
  kind: V2vSelectedVmKind
  check: V2vSelectedVmCheck
  mapping: V2vMappingSummary | undefined
  item: V2vSelectedVm
}

export type V2vListPair = {
  sourceHost?: string
  poolName?: string
}

export function useV2vSelectedVms({ migrationList, rows, areRowsReady, poolId, selectedVmId }: V2vSelectedVmsContext) {
  const { t } = useI18n()

  const { getKindTag, getCheckInfo, getMappingParts, getReadinessTags } = useV2vVmLabels()

  const { getStepLocation } = useV2vWizardNavigation()

  const { open: openConfirmModal } = useDeleteModal()

  const { getPoolById } = useXoPoolCollection()

  const { choices: offers, areChoicesReady: areOffersReady } = useV2vPoolDestinationChoices(poolId)

  const { sourceHost, poolName } = useV2vSourceAndDestination(poolId)

  const rowsById = computed(() => new Map(toValue(rows).map(row => [row.id, row])))

  function getRow(id: XoV2vVm['id']) {
    return rowsById.value.get(id)
  }

  // The list may outlive a VM of the inventory: its id is all that is left to name it
  function getName(id: XoV2vVm['id']) {
    return getRow(id)?.name ?? id
  }

  const targetNameGetters = useV2vTargetNameGetters()

  // Only a partial import on another pool names a pool
  function getCheckPoolName(check: V2vSelectedVmCheck) {
    return check.type === 'partial-on-other-pool' ? getPoolById(check.poolId)?.name_label : undefined
  }

  const vms = computed(() => {
    const list = migrationList.list.value

    if (list === undefined) {
      return []
    }

    return list.vms.map((listVm): V2vListedVm => {
      const { id } = listVm
      const row = getRow(id)
      const mapping = row === undefined ? undefined : getV2vVmMapping(row.vm, listVm, list.defaults, offers.value)
      const { kind, check } = getV2vSelectedVmState(row, toValue(poolId), mapping?.state)
      const mappingSummary = getV2vMappingSummary(mapping, kind, targetNameGetters)

      return {
        kind,
        check,
        mapping: mappingSummary,
        item: {
          id,
          name: getName(id),
          // A VM gone from the source is neither new nor resumed: its check alone tells it
          kind: check.type === 'not-found' ? undefined : getKindTag(kind),
          mappingParts: getMappingParts(mappingSummary),
          check: getCheckInfo(check, getCheckPoolName(check)),
          mappingRoute: getStepLocation('mapping', { vm: id }),
          isSelected: id === toValue(selectedVmId),
        },
      }
    })
  })

  const items = computed(() => vms.value.map(vm => vm.item))

  // What the launch plan reads of each VM, rather than what the panel shows of it
  const vmStates = computed(() =>
    vms.value.map(({ kind, check, mapping, item }) => ({
      id: item.id,
      name: item.name,
      kind,
      check,
      checkInfo: item.check,
      mapping,
    }))
  )

  const count = computed(() => vms.value.length)

  const isEmpty = computed(() => count.value === 0)

  // Until the rows are ready, the import state of a VM is unknown: a warm one would read as new and ready. Until the
  // choices of the pool are, its mapping would read incomplete
  const isBusy = computed(() => !toValue(areRowsReady) || !areOffersReady.value)

  const readinessTags = computed(() => {
    const levels = vms.value.map(vm => vm.check.level)

    return getReadinessTags(countOccurrences(V2V_READINESS_LEVELS, levels))
  })

  const listPair = computed((): V2vListPair => ({ sourceHost: sourceHost.value, poolName: poolName.value }))

  const panel = computed(
    (): V2vSelectedVmsPanelProps => ({
      items: items.value,
      count: count.value,
      isEmpty: isEmpty.value,
      isBusy: isBusy.value,
      readinessTags: readinessTags.value,
      listPair: listPair.value,
    })
  )

  // One confirmation for removing one VM or all of them: either way, only the list changes
  async function confirmListChange(subject: string, confirmLabel: string) {
    const { event } = await openConfirmModal({
      props: { subject, confirmLabel, description: t('v2v:remove-from-list-info') },
    })

    return event === 'onConfirm'
  }

  // For a caller with something to do once the VM left the list, such as closing its panel
  function confirmRemove(id: XoV2vVm['id']) {
    return confirmListChange(t('v2v:name-from-migration-list', { name: getName(id) }), t('action:remove'))
  }

  async function remove(id: XoV2vVm['id']) {
    if (await confirmRemove(id)) {
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

  return {
    vmStates,
    getRow,
    items,
    vms,
    count,
    isEmpty,
    isBusy,
    readinessTags,
    listPair,
    panel,
    confirmRemove,
    remove,
    clear,
  }
}
