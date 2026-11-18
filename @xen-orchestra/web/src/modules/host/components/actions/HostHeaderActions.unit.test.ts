import HostHeaderActions from '@/modules/host/components/actions/HostHeaderActions.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import {
  findHeadBarActionLabels,
  findMenuEntries,
  findMenuEntryIndex,
  openMoreActions,
} from '@/test/head-bar-actions.ts'
import { t } from '@/test/i18n.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { useCollapseOnOverflow } from '@core/composables/collapse-on-overflow.composable.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { resetCollapsedCount } = vi.hoisted(() => ({
  resetCollapsedCount: vi.fn(),
}))

const collapsedCount = ref(0)

mockModule(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    useGetHostById: () => ref(undefined),
    areHostsFetching: ref(false),
    areHostsReady: ref(true),
    hasHostFetchError: ref(false),
  })) as unknown as typeof useXoHostCollection,
}))

mockModule(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolById: () => undefined,
    hasPoolById: () => true,
  })) as unknown as typeof useXoPoolCollection,
}))

mockModule(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById: () => undefined })) as unknown as typeof useXoTaskCollection,
}))

mockModule(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vmsByHost: ref(new Map()) })) as unknown as typeof useXoVmCollection,
}))

mockModule(import('@core/composables/collapse-on-overflow.composable.ts'), () => ({
  useCollapseOnOverflow: (() => ({
    collapsedCount,
    reset: resetCollapsedCount,
  })) as unknown as typeof useCollapseOnOverflow,
}))

beforeEach(() => {
  resetCollapsedCount.mockReset()
  collapsedCount.value = 0
})

function mountActions(host: FrontXoHost = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: true })) {
  return mount(HostHeaderActions, { props: { host }, global: createGlobalTestConfig() })
}

describe('when every quick action fits', () => {
  it('shows the new VM, shutdown and reboot actions of a running host in the header', () => {
    const wrapper = mountActions()

    expect(findHeadBarActionLabels(wrapper)).toEqual([t('new-vm'), t('action:shutdown'), t('action:reboot')])
  })

  it('shows the new VM and start actions of a halted host in the header', () => {
    const wrapper = mountActions(createHost({ power_state: HOST_POWER_STATE.HALTED }))

    expect(findHeadBarActionLabels(wrapper)).toEqual([t('new-vm'), t('action:start')])
  })

  it('lists the other state changes, then the other actions, in the more actions menu of a running host', async () => {
    const wrapper = mountActions()

    await openMoreActions(wrapper)

    const entries = findMenuEntries(wrapper)

    expect(entries[0]).toBe(t('action:change-state'))
    expect(findMenuEntryIndex(wrapper, t('action:force-reboot'))).toBe(1)
    expect(findMenuEntryIndex(wrapper, t('action:emergency-shutdown'))).toBeLessThan(
      findMenuEntryIndex(wrapper, t('actions'))
    )
    expect(findMenuEntryIndex(wrapper, t('action:restart-toolstack'))).toBe(
      findMenuEntryIndex(wrapper, t('actions')) + 1
    )
    expect(entries.at(-1)).toBe(t('action:download-bugtools-archive'))

    for (const label of [t('new-vm'), t('action:shutdown'), t('action:reboot')]) {
      expect(entries).not.toContain(label)
    }
  })

  it('leaves out the change state section of a halted host whose start action is in the header', async () => {
    const wrapper = mountActions(createHost({ power_state: HOST_POWER_STATE.HALTED }))

    await openMoreActions(wrapper)

    expect(findMenuEntries(wrapper)[0]).toBe(t('actions'))
    expect(findMenuEntryIndex(wrapper, t('action:change-state'))).toBe(-1)
  })
})

describe('when the quick actions do not fit', () => {
  it('moves the reboot and shutdown into the change state section, in their usual order', async () => {
    collapsedCount.value = 2

    const wrapper = mountActions()

    await openMoreActions(wrapper)

    expect(findHeadBarActionLabels(wrapper)).toEqual([t('new-vm')])
    expect(findMenuEntryIndex(wrapper, t('action:reboot'))).toBe(
      findMenuEntryIndex(wrapper, t('action:change-state')) + 1
    )
    expect(findMenuEntryIndex(wrapper, t('action:shutdown'))).toBe(
      findMenuEntryIndex(wrapper, t('action:emergency-shutdown')) - 1
    )
  })

  it('moves the new VM action first in the actions section', async () => {
    collapsedCount.value = 3

    const wrapper = mountActions()

    await openMoreActions(wrapper)

    expect(findHeadBarActionLabels(wrapper)).toEqual([])
    expect(findMenuEntryIndex(wrapper, t('new-vm'))).toBe(findMenuEntryIndex(wrapper, t('actions')) + 1)
  })

  it('shows the change state section of a halted host once its start action is in the menu', async () => {
    collapsedCount.value = 1

    const wrapper = mountActions(createHost({ power_state: HOST_POWER_STATE.HALTED }))

    await openMoreActions(wrapper)

    expect(findMenuEntries(wrapper)[0]).toBe(t('action:change-state'))
    expect(findMenuEntryIndex(wrapper, t('action:start'))).toBe(1)
  })
})

it('measures the header again when the quick actions change with the power state', async () => {
  const wrapper = mountActions()

  await wrapper.setProps({ host: createHost({ power_state: HOST_POWER_STATE.HALTED }) })

  expect(resetCollapsedCount).toHaveBeenCalledOnce()
})
