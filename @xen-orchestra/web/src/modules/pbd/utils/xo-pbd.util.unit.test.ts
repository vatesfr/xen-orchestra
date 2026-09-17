import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

const attachedPbd = createPbd({ attached: true })
const detachedPbd = createPbd({ attached: false })

describe('getPbdsConnectionStatus', () => {
  it('reports a disconnected status when there is no PBD at all', () => {
    expect(getPbdsConnectionStatus([])).toBe(CONNECTION_STATUS.DISCONNECTED)
  })

  it('reports a disconnected status when every PBD is detached', () => {
    expect(getPbdsConnectionStatus([detachedPbd, detachedPbd])).toBe(CONNECTION_STATUS.DISCONNECTED)
  })

  it('reports a partially connected status when only some PBDs are attached', () => {
    expect(getPbdsConnectionStatus([attachedPbd, detachedPbd])).toBe(CONNECTION_STATUS.PARTIALLY_CONNECTED)
  })

  it('reports a connected status when every PBD is attached', () => {
    expect(getPbdsConnectionStatus([attachedPbd, attachedPbd])).toBe(CONNECTION_STATUS.CONNECTED)
  })

  it('reads the status of a lone PBD from its own attached state', () => {
    expect(getPbdsConnectionStatus([attachedPbd])).toBe(CONNECTION_STATUS.CONNECTED)
    expect(getPbdsConnectionStatus([detachedPbd])).toBe(CONNECTION_STATUS.DISCONNECTED)
  })
})
