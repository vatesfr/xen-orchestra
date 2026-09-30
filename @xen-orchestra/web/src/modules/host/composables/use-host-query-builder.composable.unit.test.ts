import { useHostQueryBuilder } from '@/modules/host/composables/use-host-query-builder.composable.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { HOST_POWER_STATE } from '@vates/types'

describe('items', () => {
  it('keeps only the hosts matching the initial filter', () => {
    const runningHost = createHost({ id: 'host-1' as FrontXoHost['id'], power_state: HOST_POWER_STATE.RUNNING })
    const haltedHost = createHost({ id: 'host-2' as FrontXoHost['id'], power_state: HOST_POWER_STATE.HALTED })

    const { wrapper } = mountComposable(() =>
      useHostQueryBuilder('hosts', [runningHost, haltedHost], {
        initialFilter: `power_state:${HOST_POWER_STATE.HALTED}`,
      })
    )

    expect(wrapper.vm.items).toEqual([haltedHost])
  })
})
