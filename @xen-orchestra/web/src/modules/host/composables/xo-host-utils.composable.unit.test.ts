import { useXoHostUtils } from '@/modules/host/composables/xo-host-utils.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { HOST_POWER_STATE } from '@vates/types'

function mountHostUtils() {
  return mountComposable(() => useXoHostUtils()).result
}

describe('getPowerState', () => {
  test('maps the running state to its label and running-circle icon', () => {
    const { getPowerState } = mountHostUtils()

    expect(getPowerState(HOST_POWER_STATE.RUNNING)).toEqual({ text: 'Running', icon: 'status:running-circle' })
  })

  test('maps the halted state to its label and halted-circle icon', () => {
    const { getPowerState } = mountHostUtils()

    expect(getPowerState(HOST_POWER_STATE.HALTED)).toEqual({ text: 'Halted', icon: 'status:halted-circle' })
  })

  test('maps the unknown state to its label and no icon', () => {
    const { getPowerState } = mountHostUtils()

    expect(getPowerState(HOST_POWER_STATE.UNKNOWN)).toEqual({ text: 'Unknown', icon: undefined })
  })

  test('falls back to the unknown entry for an out-of-range value', () => {
    const { getPowerState } = mountHostUtils()

    const outOfRangeState = 'Suspended' as HOST_POWER_STATE

    expect(getPowerState(outOfRangeState)).toEqual({ text: 'Unknown', icon: undefined })
  })
})

describe('getRelativeStartTime', () => {
  test('returns a computed whose value is a string', () => {
    const relativeStartTime = mountComposable(() => useXoHostUtils().getRelativeStartTime(1660000000)).result

    expect(typeof relativeStartTime.value).toBe('string')
  })
})
