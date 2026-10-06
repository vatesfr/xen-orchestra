import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

describe('getPbdsConnectionStatus', () => {
  it('is disconnected when there are no PBDs', () => {
    expect(getPbdsConnectionStatus([])).toBe(CONNECTION_STATUS.DISCONNECTED)
  })

  it('is disconnected when no PBD is attached', () => {
    expect(getPbdsConnectionStatus([createPbd({ attached: false }), createPbd({ attached: false })])).toBe(
      CONNECTION_STATUS.DISCONNECTED
    )
  })

  it('is partially connected when only some PBDs are attached', () => {
    expect(getPbdsConnectionStatus([createPbd({ attached: true }), createPbd({ attached: false })])).toBe(
      CONNECTION_STATUS.PARTIALLY_CONNECTED
    )
  })

  it('is connected when every PBD is attached', () => {
    expect(getPbdsConnectionStatus([createPbd({ attached: true }), createPbd({ attached: true })])).toBe(
      CONNECTION_STATUS.CONNECTED
    )
  })
})
