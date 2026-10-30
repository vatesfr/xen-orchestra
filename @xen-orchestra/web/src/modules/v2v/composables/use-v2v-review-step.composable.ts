import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import { useV2vImportVm } from '@/modules/v2v/composables/use-v2v-import-vm.composable.ts'
import { useV2vMigrationListRows } from '@/modules/v2v/composables/use-v2v-migration-list-rows.composable.ts'
import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { useV2vSelectedVms } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { useV2vLaunchForm } from '@/modules/v2v/form/use-v2v-launch-form.ts'
import { useXoV2vStartJob } from '@/modules/v2v/jobs/xo-v2v-start.job.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type {
  V2vLaunchGroupType,
  V2vStartProblem,
  V2vStartVm,
  V2vVmLaunchOptionsRow,
  V2vVmLaunchOverrides,
} from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vLaunchPlan } from '@/modules/v2v/utils/v2v-launch-plan.util.ts'
import { getV2vTargetName, setV2vOverride } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { buildV2vStartPayload, getV2vStartProblems } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { getV2vNextTransfer } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useApiErrorMessage } from '@/shared/composables/api-error-message.composable.ts'
import type { XoV2vStartPayload, XoV2vVm } from '@vates/types'
import { compact, uniq } from 'lodash-es'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

export type V2vExcludedVm = {
  id: XoV2vVm['id']
  name: string
  route: RouteLocationRaw
  reason: string
}

export type V2vMigratedVm = {
  id: XoV2vVm['id']
  name: string
  importVm: { id: FrontXoVm['id']; name: string }
  poolName: string
  srs: string
  cutover?: string
  isConfirmed: boolean
}

export type V2vResumedVm = {
  id: XoV2vVm['id']
  name: string
  parts: string[]
}

// A refused launch tells every problem at once, so the user fixes them all before launching again
export type V2vLaunchError = { title: string; messages: string[] }

export type V2vLaunched = {
  count: number
  taskRoute: RouteLocationRaw
}

// Grouped by the checks of the selected VMs panel: the review never launches a VM the panel shows blocked
export function useV2vReviewStep() {
  const { t } = useI18n()

  const { getErrorMessage } = useApiErrorMessage()

  const connectionStore = useV2vConnectionStore()

  const { goToStep, getStepLocation } = useV2vWizardNavigation()

  const labels = useV2vVmLabels()

  const listRows = useV2vMigrationListRows()

  const { poolId, migrationList } = listRows

  const { vmStates, getRow, getName, isBusy } = useV2vSelectedVms(listRows)

  const { getPoolById } = useXoPoolCollection()

  const { getSrById } = useXoSrCollection()

  const { getImportPoolName, getImportActiveMapping } = useV2vImportVm()

  const form = useV2vLaunchForm()

  const confirmedIds = reactive(new Set<XoV2vVm['id']>())

  const overridesById = reactive(new Map<XoV2vVm['id'], V2vVmLaunchOverrides>())

  const plan = computed(() => getV2vLaunchPlan(vmStates.value, confirmedIds))

  const destinationPool = computed(() => getPoolById(poolId.value))

  const destinationPoolName = useV2vPoolName(poolId)

  // Where the disks of an import are, read from the import itself: one SR may hold several of them
  function getImportSrNames(row: V2vVmRow, importVm: FrontXoVm): string[] {
    const { disks } = getImportActiveMapping(row.vm, importVm)

    return uniq(compact(disks.map(({ srId }) => getV2vTargetName(srId, id => getSrById(id)?.name_label))))
  }

  // Each group VM with the import its row holds and where it is: only a VM with an import is migrated or resumed
  function withImports<TItem extends { id: XoV2vVm['id'] }>(items: TItem[]) {
    return items.flatMap(item => {
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
          poolName: getImportPoolName(importVm),
          srNames: getImportSrNames(row, importVm),
        },
      ]
    })
  }

  const unconfirmedCount = computed(() => plan.value.migrated.filter(({ id }) => !confirmedIds.has(id)).length)

  const summaryParts = computed(() =>
    labels.getReviewSummaryParts(destinationPoolName.value, vmStates.value.length, {
      excluded: plan.value.excluded.length,
      unconfirmed: unconfirmedCount.value,
    })
  )

  const groupHeadings = computed(
    () =>
      ({
        excluded: labels.getLaunchGroupHeading('excluded'),
        migrated: labels.getLaunchGroupHeading('migrated'),
        resumed: labels.getLaunchGroupHeading('resumed'),
        new: labels.getLaunchGroupHeading('new'),
      }) satisfies Record<V2vLaunchGroupType, unknown>
  )

  const excludedVms = computed(() =>
    plan.value.excluded.map(
      ({ id, name, checkInfo }): V2vExcludedVm => ({
        id,
        name,
        route: getStepLocation('mapping', { vm: id }),
        reason: checkInfo.label,
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
        srs: srNames.join(', '),
        cutover: labels.getCutoverLabel(row.cutoverAt),
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
      plan.value.new.map(({ name }) => name),
      newVmsSrNames.value
    )
  )

  const vmLaunchOptionsRows = computed(() =>
    plan.value.launchable.map(({ id, name }): V2vVmLaunchOptionsRow => ({ id, name, overrides: overridesById.get(id) }))
  )

  const launchCount = computed(() => plan.value.launchable.length)

  const startVms = computed(() =>
    plan.value.launchable.flatMap(({ id, kind }): V2vStartVm[] => {
      const listVm = migrationList.list.value?.vms.find(vm => vm.id === id)

      if (listVm === undefined) {
        return []
      }

      const { disks, nics, template } = listVm

      return [{ id, kind, disks, nics, template, overrides: overridesById.get(id) }]
    })
  )

  const payload = ref<XoV2vStartPayload>()

  const { run, isRunning: isLaunching } = useXoV2vStartJob(destinationPool, payload)

  const launchError = ref<V2vLaunchError>()

  const launched = ref<V2vLaunched>()

  const canLaunch = computed(() => launchCount.value > 0)

  function confirmSecondCopy(id: XoV2vVm['id'], isConfirmed: boolean) {
    if (isConfirmed) {
      confirmedIds.add(id)
    } else {
      confirmedIds.delete(id)
    }
  }

  function changeStopSource(id: XoV2vVm['id'], value: boolean | undefined) {
    const overrides = setV2vOverride(overridesById.get(id), 'stopSource', value, form.formData.stopSource)

    if (overrides === undefined) {
      overridesById.delete(id)
    } else {
      overridesById.set(id, overrides)
    }
  }

  // A problem names its VM as the list does
  function getProblemLabel({ vmId, message }: V2vStartProblem) {
    return labels.getStartProblemLabel(message, vmId === undefined ? undefined : getName(vmId))
  }

  function getLaunchError(error: unknown): V2vLaunchError {
    const problems = getV2vStartProblems(error)

    if (problems !== undefined) {
      return { title: t('v2v:launch-problems'), messages: problems.map(getProblemLabel) }
    }

    return { title: t('error'), messages: [getErrorMessage(error)] }
  }

  async function launch() {
    launchError.value = undefined

    const connection = connectionStore.connection
    const list = migrationList.list.value

    // Without a connection or a list, the wizard does not show the step: the check narrows their types
    if (connection === undefined || list === undefined) {
      return
    }

    const isValid = await form.validate()
    const { concurrency } = form.formData

    // A valid form has a concurrency: the check narrows its type
    if (!isValid || concurrency === undefined) {
      return
    }

    const count = launchCount.value

    payload.value = buildV2vStartPayload({
      connection,
      defaults: list.defaults,
      settings: { ...form.formData, concurrency },
      vms: startVms.value,
    })

    try {
      const taskId = await run()

      launched.value = { count, taskRoute: getTaskRoute(taskId) }
    } catch (error) {
      launchError.value = getLaunchError(error)
    }
  }

  return {
    isBusy,
    summaryParts,
    destinationPoolName,
    form,
    vmLaunchOptionsRows,
    groupHeadings,
    excludedVms,
    migratedVms,
    resumedVms,
    newVmsCount,
    newVmsSummary,
    launchCount,
    canLaunch,
    isLaunching,
    launchError,
    launched,
    confirmSecondCopy,
    changeStopSource,
    launch,
    back: () => goToStep('mapping'),
    backToVms: () => goToStep('vms'),
  }
}
