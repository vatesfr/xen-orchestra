import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import type { V2vLaunchGroupType } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vUnsupportedReason, V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { V2vVmPresetId } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { V2V_VM_STATUSES, type V2vNextTransfer, type V2vVmStatus } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { CounterAccent } from '@core/components/ui/counter/UiCounter.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { V2V_VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A list, not only a type: `mapCountedKeys` needs the keys in the order the review summary tells them
export const V2V_REVIEW_COUNTED = ['excluded', 'unconfirmed'] as const

export type V2vReviewCounts = Record<(typeof V2V_REVIEW_COUNTED)[number], number>

export type V2vVmStatusSummary = {
  total: number
  counts: Record<V2vVmStatus, number>
}

const STATUS_ACCENTS: Record<V2vVmStatus, TagAccent> = {
  none: 'neutral',
  running: 'warning',
  warm: 'info',
  cold: 'success',
}

const LAUNCH_GROUP_ACCENTS: Record<V2vLaunchGroupType, CounterAccent> = {
  excluded: 'danger',
  migrated: 'warning',
  resumed: 'brand',
  new: 'success',
}

export function useV2vVmLabels() {
  const { t } = useI18n()

  const statusLabels = computed<Record<V2vVmStatus, string>>(() => ({
    none: t('not-migrated'),
    running: t('in-progress'),
    warm: t('v2v:status:warm'),
    cold: t('v2v:status:cold'),
  }))

  const powerLabels = computed<Record<V2V_VM_POWER_STATE, string>>(() => ({
    [V2V_VM_POWER_STATE.POWERED_ON]: t('vm:status:running'),
    [V2V_VM_POWER_STATE.POWERED_OFF]: t('vm:status:halted'),
    [V2V_VM_POWER_STATE.SUSPENDED]: t('vm:status:suspended'),
  }))

  const presetLabels = computed<Record<V2vVmPresetId, string>>(() => ({
    all: t('all'),
    'not-migrated': statusLabels.value.none,
    'not-ready': t('not-ready'),
    'in-progress': statusLabels.value.running,
    warm: statusLabels.value.warm,
    cold: statusLabels.value.cold,
  }))

  const unsupportedReasonLabels = computed<Record<V2vUnsupportedReason, string>>(() => ({
    rdm: t('v2v:unsupported-rdm-disk'),
    independent: t('v2v:unsupported-independent-disk'),
    encrypted: t('v2v:unsupported-encrypted-disk'),
  }))

  // An unsupported VM cannot be migrated: its reason matters more than its status
  function getStatusTag({
    migration,
    unsupportedReason,
  }: Pick<V2vVmRow, 'migration' | 'unsupportedReason'>): V2vAccentedLabel<TagAccent> {
    if (unsupportedReason !== undefined) {
      return { label: unsupportedReasonLabels.value[unsupportedReason], accent: 'danger' }
    }

    return { label: statusLabels.value[migration], accent: STATUS_ACCENTS[migration] }
  }

  const statusCountLabelGetters: Record<V2vVmStatus, (count: number) => string> = {
    none: count => t('n-not-migrated', { n: count }),
    running: count => t('n-in-progress', { n: count }),
    warm: count => t('n-partially-migrated', { n: count }),
    cold: count => t('n-migrated', { n: count }),
  }

  function getStatusCountLabel(status: V2vVmStatus, count: number): string {
    return statusCountLabelGetters[status](count)
  }

  function getSummaryLabels({ total, counts }: V2vVmStatusSummary): string[] {
    return [t('n-vms', { n: total }), ...mapCountedKeys(V2V_VM_STATUSES, counts, getStatusCountLabel)]
  }

  // The panel and the review word a resumed VM alike: its transfer, then where it goes, then its kept mapping
  const resumedTransferLabels = computed<Record<V2vNextTransfer, string>>(() => ({
    delta: t('v2v:delta-from-last-sync'),
    full: t('full-transfer'),
  }))

  function getResumedParts(transfer: V2vNextTransfer, ...details: string[]): string[] {
    return [resumedTransferLabels.value[transfer], ...details, t('v2v:mapping-locked')]
  }

  function withTargets(countLabel: string, targets: string[] | undefined): string {
    return targets === undefined
      ? countLabel
      : t('source-to-destination', { source: countLabel, destination: targets.join(', ') })
  }

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
    statusLabels,
    powerLabels,
    presetLabels,
    unsupportedReasonLabels,
    getStatusTag,
    getStatusCountLabel,
    getSummaryLabels,
    getLaunchOptionLabel,
    getResumedParts,
    withTargets,
    getLaunchGroupHeading,
    getReviewSummaryParts,
    getResumedVmParts,
    getCutoverLabel,
    getNewVmsSummary,
    getStartProblemLabel,
  }
}
