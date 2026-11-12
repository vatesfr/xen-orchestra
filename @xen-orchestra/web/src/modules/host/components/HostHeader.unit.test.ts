import HostHeader from '@/modules/host/components/HostHeader.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createHost } from '@/test/create-host.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { objectIcon } from '@core/icons'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE, VM_OPERATIONS } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { isMasterHost, vmsByHost, buildXo5Route } = vi.hoisted(() => ({
  isMasterHost: vi.fn(),
  vmsByHost: vi.fn(),
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ isMasterHost })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vmsByHost: computed(() => vmsByHost()) })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

beforeEach(() => {
  isMasterHost.mockReset()
  vmsByHost.mockReset()
  buildXo5Route.mockReset()

  isMasterHost.mockReturnValue(false)
  vmsByHost.mockReturnValue(new Map())
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
})

function mountHeader(host: FrontXoHost = createHost()) {
  return mount(HostHeader, {
    props: { host },
    global: createGlobalTestConfig({ router: createTestRouter() }),
  })
}

function createRebootingHost() {
  return createHost({
    power_state: HOST_POWER_STATE.RUNNING,
    enabled: true,
    current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT },
  })
}

function findHeadBarIcon(wrapper: ReturnType<typeof mountHeader>) {
  return wrapper.getComponent(UiHeadBar).getComponent(VtsIcon).props('name')
}

it('shows the name of the host', () => {
  const wrapper = mountHeader(createHost({ name_label: 'Primary Host' }))

  expect(wrapper.get('.ui-head-bar .label').text()).toBe('Primary Host')
})

it('shows the icon matching the state of the host and no loader', () => {
  const wrapper = mountHeader(
    createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: true, current_operations: {} })
  )

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('host', 'running'))
  expect(wrapper.find('.ui-head-bar .ui-loader').exists()).toBe(false)
})

it('shows the busy icon and a loader next to the title while the host is changing state', () => {
  const wrapper = mountHeader(createRebootingHost())

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('host', 'busy'))
  expect(wrapper.find('.ui-head-bar .status .ui-loader').exists()).toBe(true)
})

it('shows the pending operation in the tooltip of the loader', async () => {
  const wrapper = mountHeader(createRebootingHost())

  expect(await findTooltipContent(wrapper.get('.ui-head-bar .status .ui-loader').element)).toBe(
    t('operation-in-progress', { operation: t('operation:clean-reboot') })
  )
})

it('shows the pending operation in the tooltip of the busy icon', async () => {
  const wrapper = mountHeader(createRebootingHost())

  expect(await findTooltipContent(wrapper.getComponent(UiHeadBar).getComponent(VtsIcon).element)).toBe(
    t('operation-in-progress', { operation: t('operation:clean-reboot') })
  )
})

it('shows no tooltip on the icon while the host is not changing state', async () => {
  const wrapper = mountHeader(createHost({ current_operations: {} }))

  expect(await findTooltipContent(wrapper.getComponent(UiHeadBar).getComponent(VtsIcon).element)).toBeUndefined()
})

it('keeps the host state icon but shows a loader while its resident VMs are suspended for a smart reboot', () => {
  const host = createHost({
    power_state: HOST_POWER_STATE.RUNNING,
    enabled: false,
    current_operations: {},
  })

  vmsByHost.mockReturnValue(
    new Map<FrontXoHost['id'], FrontXoVm[]>([
      [host.id, [createVm({ current_operations: { 'task-1': VM_OPERATIONS.SUSPEND } })]],
    ])
  )

  const wrapper = mountHeader(host)

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('host', 'disabled'))
  expect(wrapper.find('.ui-head-bar .status .ui-loader').exists()).toBe(true)
})

it('shows the master icon next to the title when the host is the pool master', () => {
  isMasterHost.mockReturnValue(true)

  const wrapper = mountHeader(createHost({ current_operations: {} }))

  expect(wrapper.get('.ui-head-bar .status').getComponent(VtsIcon).props('name')).toBe('status:primary-circle')
})

it('shows nothing next to the title when the host is neither master nor changing state', () => {
  const wrapper = mountHeader(createHost({ current_operations: {} }))

  expect(wrapper.find('.ui-head-bar .status').exists()).toBe(false)
})
