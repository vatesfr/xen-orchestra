import type { V2vLaunchSettings, V2vVmLaunchOverrides } from '@/modules/v2v/types/v2v-launch.type.ts'
import { getV2vOverride } from '@/modules/v2v/utils/v2v-mapping.util.ts'

// Stop source is the only option a VM overrides: setting it gives all the overrides of the VM
export function setV2vVmStopSource(
  value: boolean | undefined,
  settings: Pick<V2vLaunchSettings, 'stopSource'>
): V2vVmLaunchOverrides | undefined {
  const stopSource = getV2vOverride(value, settings.stopSource)

  return stopSource === undefined ? undefined : { stopSource }
}
