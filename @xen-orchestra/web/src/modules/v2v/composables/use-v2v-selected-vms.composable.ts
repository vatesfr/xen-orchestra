import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import {
  useV2vVmLabels,
  type V2vVmCheckInfo,
  type V2vVmTag,
} from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  countV2vReadiness,
  getV2vMappingSummary,
  getV2vSelectedVmCheck,
  getV2vSelectedVmKind,
} from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import type { XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

// What the VMs step owns: the panel reads the same list and rows, never instances of its own
export type V2vSelectedVmsContext = {
  migrationList: Pick<ReturnType<typeof useV2vMigrationList>, 'list' | 'removeVm' | 'clearVms'>
  rows: MaybeRefOrGetter<V2vVmRow[]>
  poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
  sourceHost: MaybeRefOrGetter<string | undefined>
}

export type V2vSelectedVmItem = {
  id: XoV2vVm['id']
  name: string
  kind: V2vVmTag
  mappingParts: string[]
  check: V2vVmCheckInfo
  mappingRoute: RouteLocationRaw
}

export type V2vListLock = {
  sourceHost?: string
  poolName?: string
  isLocked: boolean
}

export function useV2vSelectedVms({ migrationList, rows, poolId, sourceHost }: V2vSelectedVmsContext) {
  const { t } = useI18n()

  const { getKindTag, getCheckInfo, getMappingParts, getReadinessTags } = useV2vVmLabels()

  const { getStepLocation } = useV2vWizardNavigation()

  const { open: openConfirmModal } = useDeleteModal()

  const { pools } = useXoPoolCollection()

  const { srs } = useXoSrCollection()

  const { networks } = useXoNetworkCollection()

  const poolNames = computed(() => new Map(pools.value.map(pool => [pool.id, pool.name_label])))

  const listPoolId = computed(() => toValue(poolId))

  const rowsById = computed(() => new Map(toValue(rows).map(row => [row.id, row])))

  // The list may outlive a VM of the inventory: its id is all that is left to name it
  function getName(id: XoV2vVm['id']) {
    return rowsById.value.get(id)?.name ?? id
  }

  const selectedVms = computed(() => {
    const list = migrationList.list.value

    if (list === undefined) {
      return []
    }

    return list.vms.map(({ id }) => {
      const row = rowsById.value.get(id)
      const kind = getV2vSelectedVmKind(row, listPoolId.value)

      return {
        id,
        kind,
        check: getV2vSelectedVmCheck(row, listPoolId.value),
        mapping: getV2vMappingSummary(row, kind, list.defaults, { srs: srs.value, networks: networks.value }),
      }
    })
  })

  const items = computed(() =>
    selectedVms.value.map(
      ({ id, kind, check, mapping }): V2vSelectedVmItem => ({
        id,
        name: getName(id),
        kind: getKindTag(kind),
        mappingParts: getMappingParts(mapping),
        check: getCheckInfo(check, poolNames.value),
        mappingRoute: getStepLocation('mapping', { vm: id }),
      })
    )
  )

  const count = computed(() => selectedVms.value.length)

  const isEmpty = computed(() => count.value === 0)

  const readinessTags = computed(() =>
    getReadinessTags(countV2vReadiness(selectedVms.value.map(selectedVm => selectedVm.check.level)))
  )

  const lockSummary = computed((): V2vListLock => {
    const id = listPoolId.value

    return {
      sourceHost: toValue(sourceHost),
      poolName: id === undefined ? undefined : poolNames.value.get(id),
      isLocked: !isEmpty.value,
    }
  })

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

  const isOpen = ref(true)

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { items, count, isEmpty, readinessTags, lockSummary, remove, clear, isOpen, toggle }
}
