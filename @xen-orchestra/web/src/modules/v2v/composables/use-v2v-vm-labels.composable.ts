import type { V2vTargetOrigin } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { V2vUnsupportedReason, V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { V2vVmPresetId } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { V2V_VM_STATUSES, type V2vNextTransfer, type V2vVmStatus } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { V2V_VM_POWER_STATE, type XoV2vDisk, type XoV2vPortGroup } from '@vates/types'
import { sumBy } from 'lodash-es'
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

const ORIGIN_ACCENTS: Record<V2vTargetOrigin, TagAccent> = {
  default: 'neutral',
  overridden: 'warning',
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

  return {
    statusLabels,
    powerLabels,
    presetLabels,
    unsupportedReasonLabels,
    getStatusTag,
    getStatusCountLabel,
    getSummaryLabels,
    getOriginTag,
    getPowerLabel,
    getSnapshotCountLabel,
    getDisksParts,
    getPortGroupParts,
    getDiskDetailParts,
    getNicDetailParts,
    nextTransferLabels,
  }
}
