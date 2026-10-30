import type { V2vLaunchGroupType } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vTargetOrigin } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type {
  V2vMappingSummary,
  V2vReadinessLevel,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
  V2vVmCheck,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type {
  V2vNextTransfer,
  V2vUnsupportedReason,
  V2vVmRow,
  V2vVmStatus,
} from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { V2V_READINESS_LEVELS } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import type { V2vVmPresetId } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { V2V_VM_STATUSES } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { CounterAccent } from '@core/components/ui/counter/UiCounter.vue'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { V2V_VM_POWER_STATE, type XoV2vDisk, type XoV2vPortGroup } from '@vates/types'
import { sumBy } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A list, not only a type: `mapCountedKeys` needs the keys in the order the review summary tells them
export const V2V_REVIEW_COUNTED = ['excluded', 'unconfirmed'] as const

export type V2vReviewCounts = Record<(typeof V2V_REVIEW_COUNTED)[number], number>

export type V2vVmStatusSummary = {
  total: number
  counts: Record<V2vVmStatus, number>
}

// A label with the accent of the tag or the info it is shown in
export type V2vAccentedLabel<TAccent extends string> = {
  label: string
  accent: TAccent
}

const STATUS_ACCENTS: Record<V2vVmStatus, TagAccent> = {
  none: 'neutral',
  running: 'warning',
  warm: 'info',
  cold: 'success',
}

const ORIGIN_ACCENTS: Record<V2vTargetOrigin, TagAccent> = {
  default: 'neutral',
  overridden: 'warning',
}

const KIND_ACCENTS: Record<V2vSelectedVmKind, TagAccent> = {
  new: 'neutral',
  resume: 'info',
}

const LAUNCH_GROUP_ACCENTS: Record<V2vLaunchGroupType, CounterAccent> = {
  excluded: 'danger',
  migrated: 'warning',
  resumed: 'brand',
  new: 'success',
}

// Shared by the readiness tags and the check of each VM, so a level reads the same in both
const READINESS_ACCENTS: Record<V2vReadinessLevel, TagAccent & InfoAccent> = {
  ready: 'success',
  warning: 'warning',
  blocking: 'danger',
}

// The one place a V2V VM value becomes text: the table, the filters and the selected VMs all read it from here
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

  const kindLabels = computed<Record<V2vSelectedVmKind, string>>(() => ({
    new: t('new'),
    resume: t('resume'),
  }))

  function getKindTag(kind: V2vSelectedVmKind): V2vAccentedLabel<TagAccent> {
    return { label: kindLabels.value[kind], accent: KIND_ACCENTS[kind] }
  }

  // A pool still loading is named by its id rather than not at all
  function getCheckLabel(check: V2vSelectedVmCheck | V2vVmCheck, poolName: string | undefined): string {
    switch (check.type) {
      case 'not-found':
        return t('v2v:not-found-in-source')
      case 'unsupported':
        return unsupportedReasonLabels.value[check.reason]
      case 'running':
        return t('import-in-progress')
      case 'partial-on-other-pool':
        return t('v2v:partial-import-on-pool', { pool: poolName ?? check.poolId })
      case 'mapping-incomplete':
        return t('v2v:check:mapping-incomplete')
      case 'already-migrated':
        return t('v2v:already-migrated-confirm-at-launch')
      case 'ready':
        return t('ready')
      case 'no-unsupported-disk':
        return t('v2v:check:no-unsupported-disk')
      case 'snapshots':
        return t('v2v:check:n-snapshots', { n: check.count })
      case 'no-snapshot':
        return t('v2v:check:no-snapshot')
    }
  }

  // `poolName` names the pool of the check, when it has one
  function getCheckInfo(check: V2vSelectedVmCheck | V2vVmCheck, poolName?: string): V2vAccentedLabel<InfoAccent> {
    return { label: getCheckLabel(check, poolName), accent: READINESS_ACCENTS[check.level] }
  }

  const originLabels = computed<Record<V2vTargetOrigin, string>>(() => ({
    default: t('global-default'),
    overridden: t('overridden'),
  }))

  function getOriginTag(origin: V2vTargetOrigin): V2vAccentedLabel<TagAccent> {
    return { label: originLabels.value[origin], accent: ORIGIN_ACCENTS[origin] }
  }

  function getPowerLabel(powerState: V2V_VM_POWER_STATE, hostName: string | undefined): string {
    const power = powerLabels.value[powerState]

    return hostName === undefined ? power : t('power-state-on-host', { power, host: hostName })
  }

  function getSnapshotCountLabel(count: number): string {
    return count === 0 ? t('none') : String(count)
  }

  function getDisksParts(disks: Pick<XoV2vDisk, 'capacity'>[]): string[] {
    if (disks.length === 0) {
      return [t('none')]
    }

    return [String(disks.length), formatSize(sumBy(disks, 'capacity'), 1)]
  }

  function getPortGroupParts(portGroup: XoV2vPortGroup | undefined): string[] {
    if (portGroup === undefined) {
      return []
    }

    return portGroup.vlan === undefined ? [portGroup.name] : [portGroup.name, t('vlan-id', { id: portGroup.vlan })]
  }

  function getDiskDetailParts(datastoreName: string, capacity: XoV2vDisk['capacity']): string[] {
    return [datastoreName, formatSize(capacity, 1)]
  }

  function getNicDetailParts(portGroup: XoV2vPortGroup | undefined, isMacKept: boolean): string[] {
    return isMacKept ? [...getPortGroupParts(portGroup), t('v2v:mac-kept')] : getPortGroupParts(portGroup)
  }

  const nextTransferLabels = computed<Record<V2vNextTransfer, string>>(() => ({
    delta: t('delta-transfer'),
    full: t('full-transfer'),
  }))

  // The panel and the review word a resumed VM alike: its transfer, then where it goes, then its kept mapping
  const resumedTransferLabels = computed<Record<V2vNextTransfer, string>>(() => ({
    delta: t('v2v:delta-from-last-sync'),
    full: nextTransferLabels.value.full,
  }))

  function getResumedParts(transfer: V2vNextTransfer, ...details: string[]): string[] {
    return [resumedTransferLabels.value[transfer], ...details, t('v2v:mapping-locked')]
  }

  function withTargets(countLabel: string, targets: string[] | undefined): string {
    return targets === undefined
      ? countLabel
      : t('source-to-destination', { source: countLabel, destination: targets.join(', ') })
  }

  function getMappingParts(summary: V2vMappingSummary | undefined): string[] {
    if (summary === undefined) {
      return []
    }

    if (summary.type === 'locked') {
      return getResumedParts('delta')
    }

    const { diskCount, srNames, nicCount, networkNames } = summary

    return [
      ...(diskCount > 0 ? [withTargets(t('n-disks', { n: diskCount }), srNames)] : []),
      ...(nicCount > 0 ? [withTargets(t('n-nics', { n: nicCount }), networkNames)] : []),
    ]
  }

  const readinessCountLabelGetters: Record<V2vReadinessLevel, (count: number) => string> = {
    ready: count => t('n-ready', { n: count }),
    warning: count => t('n-warnings', { n: count }),
    blocking: count => t('n-blocking', { n: count }),
  }

  function getReadinessTags(counts: Record<V2vReadinessLevel, number>): V2vAccentedLabel<TagAccent>[] {
    return mapCountedKeys(V2V_READINESS_LEVELS, counts, (level, count) => ({
      label: readinessCountLabelGetters[level](count),
      accent: READINESS_ACCENTS[level],
    }))
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
    getStatusTag,
    getStatusCountLabel,
    getSummaryLabels,
    getKindTag,
    getCheckInfo,
    getOriginTag,
    getPowerLabel,
    getSnapshotCountLabel,
    getDisksParts,
    getPortGroupParts,
    getDiskDetailParts,
    getNicDetailParts,
    nextTransferLabels,
    getMappingParts,
    getReadinessTags,
    getLaunchOptionLabel,
    getLaunchGroupHeading,
    getReviewSummaryParts,
    getResumedVmParts,
    getCutoverLabel,
    getNewVmsSummary,
    getStartProblemLabel,
  }
}
