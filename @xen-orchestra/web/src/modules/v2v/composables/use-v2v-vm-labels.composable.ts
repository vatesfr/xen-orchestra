import type { V2vUnsupportedReason, V2vVmRow, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { V2vVmPresetId } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { V2V_VM_STATUSES } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { V2V_VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type V2vVmStatusSummary = {
  total: number
  counts: Record<V2vVmStatus, number>
}

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

  return {
    statusLabels,
    powerLabels,
    presetLabels,
    unsupportedReasonLabels,
    getStatusTag,
    getStatusCountLabel,
    getSummaryLabels,
  }
}
