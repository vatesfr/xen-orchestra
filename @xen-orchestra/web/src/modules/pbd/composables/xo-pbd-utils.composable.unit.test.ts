import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

const attachedPbd = createPbd({ id: 'pbd-attached' as FrontXoPbd['id'], attached: true })
const detachedPbd = createPbd({ id: 'pbd-detached' as FrontXoPbd['id'], attached: false })

function mountPbdUtils(pbds: MaybeRefOrGetter<FrontXoPbd[]>) {
  return mountComposable(() => useXoPbdUtils(pbds)).wrapper.vm
}

describe('disconnectedPbds', () => {
  it('keeps only the detached PBDs', () => {
    expect(mountPbdUtils([attachedPbd, detachedPbd]).disconnectedPbds).toEqual([detachedPbd])
  })

  it('is empty when every PBD is attached', () => {
    expect(mountPbdUtils([attachedPbd]).disconnectedPbds).toEqual([])
  })

  it('is empty when there is no PBD at all', () => {
    expect(mountPbdUtils([]).disconnectedPbds).toEqual([])
  })

  it('accepts a getter as its source of PBDs', () => {
    expect(mountPbdUtils(() => [detachedPbd]).disconnectedPbds).toEqual([detachedPbd])
  })
})

describe('allPbdsConnectionStatus', () => {
  it('reports the connection status of the PBDs it was given', () => {
    expect(mountPbdUtils([attachedPbd, detachedPbd]).allPbdsConnectionStatus).toBe(
      CONNECTION_STATUS.PARTIALLY_CONNECTED
    )
  })

  it('follows a reassigned source of PBDs', () => {
    const pbds = ref([attachedPbd, detachedPbd])
    const result = mountPbdUtils(pbds)

    expect(result.allPbdsConnectionStatus).toBe(CONNECTION_STATUS.PARTIALLY_CONNECTED)
    expect(result.disconnectedPbds).toEqual([detachedPbd])

    pbds.value = [attachedPbd]

    expect(result.allPbdsConnectionStatus).toBe(CONNECTION_STATUS.CONNECTED)
    expect(result.disconnectedPbds).toEqual([])
  })
})
