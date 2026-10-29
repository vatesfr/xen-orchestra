import type { V2vLaunchSettings, V2vVmLaunchOverrides } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vResolvedValue } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { getV2vOverride, resolveV2vValue } from '@/modules/v2v/utils/v2v-mapping.util.ts'

export function getV2vVmStopSource(
  settings: Pick<V2vLaunchSettings, 'stopSource'>,
  overrides: V2vVmLaunchOverrides | undefined
): V2vResolvedValue<boolean> {
  return resolveV2vValue(overrides?.stopSource, settings.stopSource)
}

// Stop source is the only option a VM overrides: setting it gives all the overrides of the VM
export function setV2vVmStopSource(
  value: boolean | undefined,
  settings: Pick<V2vLaunchSettings, 'stopSource'>
): V2vVmLaunchOverrides | undefined {
  const stopSource = getV2vOverride(value, settings.stopSource)

  return stopSource === undefined ? undefined : { stopSource }
}
