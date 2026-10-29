import { getV2vVmStopSource, setV2vVmStopSource } from '@/modules/v2v/utils/v2v-launch-options.util.ts'
import { createV2vLaunchSettings } from '@/test/create-v2v-launch.ts'

describe('getV2vVmStopSource', () => {
  it.each([true, false])('follows the launch settings (%s) without override', stopSource => {
    expect(getV2vVmStopSource(createV2vLaunchSettings({ stopSource }), undefined)).toEqual({
      value: stopSource,
      origin: 'default',
    })
  })

  it('keeps a VM without stop source override on the launch settings', () => {
    expect(getV2vVmStopSource(createV2vLaunchSettings({ stopSource: false }), {})).toEqual({
      value: false,
      origin: 'default',
    })
  })

  it.each([true, false])('reads the override (%s) of the VM', stopSource => {
    expect(getV2vVmStopSource(createV2vLaunchSettings({ stopSource: !stopSource }), { stopSource })).toEqual({
      value: stopSource,
      origin: 'overridden',
    })
  })
})

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
