import { useV2vImportVm } from '@/modules/v2v/composables/use-v2v-import-vm.composable.ts'
import { useV2vPoolNameGetter } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import type { useV2vSelectedVms } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { useV2vTargetNameGetters } from '@/modules/v2v/composables/use-v2v-target-name-getters.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import type { V2vExcludedVm, V2vMigratedVm, V2vResumedVm } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vListedVm } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vLaunchPlan } from '@/modules/v2v/utils/v2v-launch-plan.util.ts'
import { getV2vTargetName } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { getV2vNextTransfer } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vVm } from '@vates/types'
import { compact, uniq } from 'lodash-es'
import { computed, reactive } from 'vue'

// Grouped by the checks of the selected VMs panel: the review never launches a VM the panel shows blocked
export function useV2vLaunchGroups({ vms, getRow }: Pick<ReturnType<typeof useV2vSelectedVms>, 'vms' | 'getRow'>) {
  const { getStepLocation } = useV2vWizardNavigation()

  const labels = useV2vReviewLabels()

  const { getSrName } = useV2vTargetNameGetters()

  const { getImportActiveMapping } = useV2vImportVm()

  const { getPoolName } = useV2vPoolNameGetter()

  const confirmedIds = reactive(new Set<XoV2vVm['id']>())

  const plan = computed(() => getV2vLaunchPlan(vms.value, confirmedIds))

  // Where the disks of an import are, read from the import itself: one SR may hold several of them
  function getImportSrNames(row: V2vVmRow, importVm: FrontXoVm): string[] {
    const { disks } = getImportActiveMapping(row.vm, importVm)

    return uniq(compact(disks.map(({ srId }) => getV2vTargetName(srId, getSrName))))
  }

  function withImports(listedVms: V2vListedVm[]) {
    return listedVms.flatMap(({ item }) => {
      const row = getRow(item.id)
      const importVm = row?.importVm

      if (row === undefined || importVm === undefined) {
        return []
      }

      return [
        {
          item,
          row,
          importVm,
          poolName: getPoolName(importVm.$pool),
          srNames: getImportSrNames(row, importVm),
        },
      ]
    })
  }

  const unconfirmedCount = computed(() => plan.value.migrated.filter(({ item }) => !confirmedIds.has(item.id)).length)

  const excludedVms = computed(() =>
    plan.value.excluded.map(
      ({ item: { id, name, check } }): V2vExcludedVm => ({
        id,
        name,
        route: getStepLocation('mapping', { vm: id }),
        reason: check.label,
      })
    )
  )

  const migratedVms = computed(() =>
    withImports(plan.value.migrated).map(
      ({ item: { id, name }, row, importVm, poolName, srNames }): V2vMigratedVm => ({
        id,
        name,
        importVm: { id: importVm.id, name: importVm.name_label },
        poolName,
        srNamesLabel: labels.getSrNamesLabel(srNames),
        cutoverLabel: labels.getCutoverLabel(row.cutoverAt),
        isConfirmed: confirmedIds.has(id),
      })
    )
  )

  const resumedVms = computed(() =>
    withImports(plan.value.resumed).map(
      ({ item: { id, name }, row, importVm, poolName, srNames }): V2vResumedVm => ({
        id,
        name,
        parts: labels.getResumedVmParts(getV2vNextTransfer(row.vm, importVm), poolName, srNames),
      })
    )
  )

  // The SR names of a VM are `undefined` while one of them loads: the summary then leaves them all out
  const newVmsSrNames = computed(() => {
    const srNames = plan.value.new.map(({ mapping }) => (mapping?.type === 'mapped' ? mapping.srNames : undefined))

    return srNames.every(names => names !== undefined) ? uniq(srNames.flat()) : undefined
  })

  const newVmsCount = computed(() => plan.value.new.length)

  const newVmsSummary = computed(() =>
    labels.getNewVmsSummary(
      plan.value.new.map(({ item }) => item.name),
      newVmsSrNames.value
    )
  )

  function confirmSecondCopy(id: XoV2vVm['id'], isConfirmed: boolean) {
    if (isConfirmed) {
      confirmedIds.add(id)
    } else {
      confirmedIds.delete(id)
    }
  }

  return {
    plan,
    unconfirmedCount,
    excludedVms,
    migratedVms,
    resumedVms,
    newVmsCount,
    newVmsSummary,
    confirmSecondCopy,
  }
}
