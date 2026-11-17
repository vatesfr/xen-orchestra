import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vLaunchGroups } from '@/modules/v2v/composables/use-v2v-launch-groups.composable.ts'
import { useV2vLaunch } from '@/modules/v2v/composables/use-v2v-launch.composable.ts'
import { useV2vMigrationListRows } from '@/modules/v2v/composables/use-v2v-migration-list-rows.composable.ts'
import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { useV2vSelectedVms } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useV2vReviewStep(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const { goToStep } = useV2vWizardNavigation()

  const labels = useV2vReviewLabels()

  const listRows = useV2vMigrationListRows()

  const { vms, getRow, getName, isBusy } = useV2vSelectedVms(listRows)

  const destinationPoolName = useV2vPoolName(rawPoolId)

  const { plan, unconfirmedCount, ...groups } = useV2vLaunchGroups({ vms, getRow })

  const launch = useV2vLaunch(rawPoolId, {
    launchableVms: () => plan.value.launchable,
    list: listRows.migrationList.list,
    getName,
  })

  const summaryParts = computed(() =>
    labels.getReviewSummaryParts(destinationPoolName.value, vms.value.length, {
      excluded: plan.value.excluded.length,
      unconfirmed: unconfirmedCount.value,
    })
  )

  return {
    isBusy,
    summaryParts,
    destinationPoolName,
    groupHeadings: labels.launchGroupHeadings,
    ...groups,
    ...launch,
    back: () => goToStep('mapping'),
    backToVms: () => goToStep('vms'),
  }
}
