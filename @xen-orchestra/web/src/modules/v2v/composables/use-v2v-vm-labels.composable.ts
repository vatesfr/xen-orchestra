import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  V2vMappingSummary,
  V2vReadinessLevel,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vUnsupportedReason, V2vVmRow, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { V2V_READINESS_LEVELS } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import type { V2vVmPresetId } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { V2V_VM_STATUSES } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { getCountedKeys } from '@/shared/utils/count.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { V2V_VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type V2vVmStatusSummary = {
  total: number
  counts: Record<V2vVmStatus, number>
}

export type V2vVmTag = {
  label: string
  accent: TagAccent
}

export type V2vVmCheckInfo = {
  label: string
  accent: InfoAccent
}

const STATUS_ACCENTS: Record<V2vVmStatus, TagAccent> = {
  none: 'neutral',
  running: 'warning',
  warm: 'info',
  cold: 'success',
}

const KIND_ACCENTS: Record<V2vSelectedVmKind, TagAccent> = {
  new: 'neutral',
  resume: 'info',
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
  function getStatusTag({ migration, unsupportedReason }: Pick<V2vVmRow, 'migration' | 'unsupportedReason'>): V2vVmTag {
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
    const countedStatuses = getCountedKeys(V2V_VM_STATUSES, counts)

    return [t('n-vms', { n: total }), ...countedStatuses.map(status => getStatusCountLabel(status, counts[status]))]
  }

  const kindLabels = computed<Record<V2vSelectedVmKind, string>>(() => ({
    new: t('new'),
    resume: t('resume'),
  }))

  function getKindTag(kind: V2vSelectedVmKind): V2vVmTag {
    return { label: kindLabels.value[kind], accent: KIND_ACCENTS[kind] }
  }

  // A pool still loading is named by its id rather than not at all
  function getCheckLabel(check: V2vSelectedVmCheck, poolNames: Map<FrontXoPool['id'], string>): string {
    switch (check.type) {
      case 'not-found':
        return t('v2v:not-found-in-source')
      case 'unsupported':
        return unsupportedReasonLabels.value[check.reason]
      case 'running':
        return t('import-in-progress')
      case 'partial-on-other-pool':
        return t('v2v:partial-import-on-pool', { pool: poolNames.get(check.poolId) ?? check.poolId })
      case 'already-migrated':
        return t('v2v:already-migrated-confirm-at-launch')
      case 'ready':
        return t('ready')
    }
  }

  function getCheckInfo(check: V2vSelectedVmCheck, poolNames: Map<FrontXoPool['id'], string>): V2vVmCheckInfo {
    return { label: getCheckLabel(check, poolNames), accent: READINESS_ACCENTS[check.level] }
  }

  function withTarget(countLabel: string, target: string | undefined): string {
    return target === undefined ? countLabel : t('source-to-destination', { source: countLabel, destination: target })
  }

  function getMappingParts(summary: V2vMappingSummary | undefined): string[] {
    if (summary === undefined) {
      return []
    }

    if (summary.type === 'locked') {
      return [t('v2v:delta-from-last-sync'), t('v2v:mapping-locked')]
    }

    const { diskCount, srName, nicCount, networkName } = summary

    return [
      ...(diskCount > 0 ? [withTarget(t('n-disks', { n: diskCount }), srName)] : []),
      ...(nicCount > 0 ? [withTarget(t('n-nics', { n: nicCount }), networkName)] : []),
    ]
  }

  const readinessCountLabelGetters: Record<V2vReadinessLevel, (count: number) => string> = {
    ready: count => t('n-ready', { n: count }),
    warning: count => t('n-warnings', { n: count }),
    blocking: count => t('n-blocking', { n: count }),
  }

  function getReadinessTags(counts: Record<V2vReadinessLevel, number>): V2vVmTag[] {
    return getCountedKeys(V2V_READINESS_LEVELS, counts).map(level => ({
      label: readinessCountLabelGetters[level](counts[level]),
      accent: READINESS_ACCENTS[level],
    }))
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
    getMappingParts,
    getReadinessTags,
  }
}
