import { useV2vMappingSummaryLabels } from '@/modules/v2v/composables/use-v2v-mapping-summary-labels.composable.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import type { V2vLaunchGroupType } from '@/modules/v2v/types/v2v-launch.type.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { CounterAccent } from '@core/components/ui/counter/UiCounter.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A list, not only a type: `mapCountedKeys` needs the keys in the order the review summary tells them
const V2V_REVIEW_COUNTED = ['excluded', 'unconfirmed'] as const

type V2vReviewCounts = Record<(typeof V2V_REVIEW_COUNTED)[number], number>

export function useV2vReviewLabels() {
  const { t } = useI18n()

  const { getResumedParts, withTargets } = useV2vMappingSummaryLabels()

  function getOnOffLabel(value: boolean): string {
    return value ? t('option-on') : t('option-off')
  }

  function getLaunchOptionLabel(value: boolean | undefined, defaultValue: boolean): string {
    return value === undefined ? t('default-value', { value: getOnOffLabel(defaultValue) }) : getOnOffLabel(value)
  }

  const launchGroupHeadings = computed<Record<V2vLaunchGroupType, V2vAccentedLabel<CounterAccent>>>(() => ({
    excluded: { label: t('v2v:launch-group:excluded'), accent: 'danger' },
    migrated: { label: t('v2v:launch-group:migrated'), accent: 'warning' },
    resumed: { label: t('v2v:launch-group:resumed'), accent: 'brand' },
    new: { label: t('v2v:launch-group:new'), accent: 'success' },
  }))

  const reviewCountLabelGetters: Record<keyof V2vReviewCounts, (count: number) => string> = {
    excluded: count => t('v2v:n-excluded', { n: count }),
    unconfirmed: count => t('n-need-confirmation', { n: count }),
  }

  function getReviewSummaryParts(poolName: string, vmCount: number, counts: V2vReviewCounts): string[] {
    return [
      t('destination-pool-named', { name: poolName }),
      t('n-vms-in-list', { n: vmCount }),
      ...mapCountedKeys(V2V_REVIEW_COUNTED, counts, (key, count) => reviewCountLabelGetters[key](count)),
    ]
  }

  function getSrNamesLabel(srNames: string[]): string {
    return srNames.join(', ')
  }

  // A resumed VM goes on where its last sync left it: on the pool and the SRs of its import
  function getResumedVmParts(poolName: string, srNames: string[]): string[] {
    return getResumedParts(t('v2v:continues-on-pool-sr', { pool: poolName, srs: getSrNamesLabel(srNames) }))
  }

  function getCutoverLabel(cutoverAt: number | undefined): string | undefined {
    return cutoverAt === undefined ? undefined : t('v2v:cutover-done-on', { date: formatDateTime(cutoverAt) })
  }

  function getNewVmsSummary(names: string[], srNames: string[] | undefined): string {
    return withTargets(names.join(', '), srNames)
  }

  // A problem of the whole launch has no VM to name
  function getStartProblemLabel(message: string, vmName: string | undefined): string {
    return vmName === undefined ? message : t('v2v:vm-start-problem', { vm: vmName, message })
  }

  return {
    getLaunchOptionLabel,
    launchGroupHeadings,
    getReviewSummaryParts,
    getSrNamesLabel,
    getResumedVmParts,
    getCutoverLabel,
    getNewVmsSummary,
    getStartProblemLabel,
  }
}
