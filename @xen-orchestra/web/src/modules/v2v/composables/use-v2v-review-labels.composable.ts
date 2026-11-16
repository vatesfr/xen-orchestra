import { useV2vMappingLabels } from '@/modules/v2v/composables/use-v2v-mapping-labels.composable.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import type { V2vLaunchGroupType } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vNextTransfer } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { CounterAccent } from '@core/components/ui/counter/UiCounter.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A list, not only a type: `mapCountedKeys` needs the keys in the order the review summary tells them
const V2V_REVIEW_COUNTED = ['excluded', 'unconfirmed'] as const

type V2vReviewCounts = Record<(typeof V2V_REVIEW_COUNTED)[number], number>

const LAUNCH_GROUP_ACCENTS: Record<V2vLaunchGroupType, CounterAccent> = {
  excluded: 'danger',
  migrated: 'warning',
  resumed: 'brand',
  new: 'success',
}

// The text of the review step: the launch options, the launch groups, the summary and the start problems
export function useV2vReviewLabels() {
  const { t } = useI18n()

  const { getResumedParts, withTargets } = useV2vMappingLabels()

  function getOnOffLabel(value: boolean): string {
    return value ? t('option-on') : t('option-off')
  }

  // A launch option left to its default reads as that default
  function getLaunchOptionLabel(value: boolean | undefined, defaultValue: boolean): string {
    return value === undefined ? t('default-value', { value: getOnOffLabel(defaultValue) }) : getOnOffLabel(value)
  }

  const launchGroupLabels = computed<Record<V2vLaunchGroupType, string>>(() => ({
    excluded: t('v2v:launch-group:excluded'),
    migrated: t('v2v:already-fully-migrated'),
    resumed: t('v2v:launch-group:resumed'),
    new: t('v2v:launch-group:new'),
  }))

  function getLaunchGroupHeading(type: V2vLaunchGroupType): V2vAccentedLabel<CounterAccent> {
    return { label: launchGroupLabels.value[type], accent: LAUNCH_GROUP_ACCENTS[type] }
  }

  const reviewCountLabelGetters: Record<keyof V2vReviewCounts, (count: number) => string> = {
    excluded: count => t('v2v:n-excluded', { n: count }),
    unconfirmed: count => t('n-need-confirmation', { n: count }),
  }

  // No pool in the route: the summary names none rather than an empty one
  function getReviewSummaryParts(poolName: string | undefined, vmCount: number, counts: V2vReviewCounts): string[] {
    const poolParts = poolName === undefined ? [] : [t('destination-pool-named', { name: poolName })]

    return [
      ...poolParts,
      t('n-vms-in-list', { n: vmCount }),
      ...mapCountedKeys(V2V_REVIEW_COUNTED, counts, (key, count) => reviewCountLabelGetters[key](count)),
    ]
  }

  // A resumed VM goes on where its last sync left it: on the pool and the SRs of its import
  function getResumedVmParts(transfer: V2vNextTransfer, poolName: string, srNames: string[]): string[] {
    return getResumedParts(transfer, t('v2v:continues-on-pool-sr', { pool: poolName, srs: srNames.join(', ') }))
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
    getLaunchGroupHeading,
    getReviewSummaryParts,
    getResumedVmParts,
    getCutoverLabel,
    getNewVmsSummary,
    getStartProblemLabel,
  }
}
