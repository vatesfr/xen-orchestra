import { setV2vVmStopSource } from '@/modules/v2v/utils/v2v-launch-options.util.ts'
import { createV2vLaunchSettings } from '@/test/create-v2v-launch.ts'

describe('setV2vVmStopSource', () => {
  const settings = createV2vLaunchSettings({ stopSource: true })

  it('overrides the launch settings with another value', () => {
    expect(setV2vVmStopSource(false, settings)).toEqual({ stopSource: false })
  })

  it.each([true, false])('clears the override at the value (%s) of the launch settings', stopSource => {
    expect(setV2vVmStopSource(stopSource, createV2vLaunchSettings({ stopSource }))).toBeUndefined()
  })

  it('clears the override when reset', () => {
    expect(setV2vVmStopSource(undefined, settings)).toBeUndefined()
  })
})
