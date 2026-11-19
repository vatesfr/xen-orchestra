import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import type { V2vTargetOrigin } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { formatSize } from '@core/utils/size.util.ts'
import type { V2V_VM_POWER_STATE, XoV2vDisk, XoV2vPortGroup } from '@vates/types'
import { sumBy } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const ORIGIN_ACCENTS: Record<V2vTargetOrigin, TagAccent> = {
  default: 'neutral',
  overridden: 'warning',
}

// The text of the mapping side panel: the source VM, its devices, where a target comes from and the next transfer
export function useV2vMappingLabels() {
  const { t } = useI18n()

  const { powerLabels } = useV2vVmLabels()

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

  return {
    getOriginTag,
    getPowerLabel,
    getSnapshotCountLabel,
    getDisksParts,
    getPortGroupParts,
    getDiskDetailParts,
    getNicDetailParts,
  }
}
