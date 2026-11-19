import HostHeader from '@/modules/host/components/HostHeader.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import { findHeadBarLabel, findHeadBarLoader, findHeadBarStatus, getHeadBarIcon } from '@/test/find-header.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { taskCollectionMock, mockXoTaskCollection } from '@/test/mock-xo-task-collection.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { objectIcon } from '@core/icons'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE, VM_OPERATIONS } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoCollections('host')

mockXoTaskCollection()

mockXoVmCollection()

mockXoRoutes()

beforeEach(() => {
  xoCollectionsMock.reset()
  taskCollectionMock.reset()
  vmCollectionMock.reset()
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

it('shows the name of the host', () => {
  const wrapper = mountHeader(createHost({ name_label: 'Primary Host' }))

  expect(findHeadBarLabel(wrapper)).toBe('Primary Host')
})

it('shows the icon matching the state of the host and no loader', () => {
  const wrapper = mountHeader(
    createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: true, current_operations: {} })
  )

  expect(getHeadBarIcon(wrapper).props('name')).toBe(objectIcon('host', 'running'))
  expect(findHeadBarLoader(wrapper).exists()).toBe(false)
})

const PENDING_OPERATION_TOOLTIP_CASES = [
  {
    name: 'shows the pending operation in the tooltip of the loader',
    findElement: (wrapper: ReturnType<typeof mountHeader>) => findHeadBarLoader(wrapper, { nextToLabel: true }).element,
  },
  {
    name: 'shows the pending operation in the tooltip of the busy icon',
    findElement: (wrapper: ReturnType<typeof mountHeader>) => getHeadBarIcon(wrapper).element,
  },
]

for (const { name, findElement } of PENDING_OPERATION_TOOLTIP_CASES) {
  it(name, async () => {
    const wrapper = mountHeader(createRebootingHost())

    expect(await findTooltipContent(findElement(wrapper))).toBe(
      t('operation-in-progress', { operation: t('operation:clean-reboot') })
    )
  })
}

it('shows no tooltip on the icon while the host is not changing state', async () => {
  const wrapper = mountHeader(createHost({ current_operations: {} }))

  expect(await findTooltipContent(getHeadBarIcon(wrapper).element)).toBeUndefined()
})

const LOADER_CASES = [
  {
    name: 'shows the busy icon and a loader next to the title while the host is changing state',
    host: createRebootingHost,
    icon: objectIcon('host', 'busy'),
  },
  {
    name: 'keeps the host state icon but shows a loader while its resident VMs are suspended for a smart reboot',
    host: () => {
      const host = createHost({
        power_state: HOST_POWER_STATE.RUNNING,
        enabled: false,
        current_operations: {},
      })

      vmCollectionMock.vms.value = [
        createVm({ $container: host.id, current_operations: { 'task-1': VM_OPERATIONS.SUSPEND } }),
      ]

      return host
    },
    icon: objectIcon('host', 'disabled'),
  },
]

for (const { name, host, icon } of LOADER_CASES) {
  it(name, () => {
    const wrapper = mountHeader(host())

    expect(getHeadBarIcon(wrapper).props('name')).toBe(icon)
    expect(findHeadBarLoader(wrapper, { nextToLabel: true }).exists()).toBe(true)
  })
}

it('shows the master icon next to the title when the host is the pool master', () => {
  const host = createHost({ current_operations: {} })
  xoCollectionsMock.seedMasterHost(host)

  const wrapper = mountHeader(host)

  expect(findHeadBarStatus(wrapper).getComponent(VtsIcon).props('name')).toBe('status:primary-circle')
})

it('shows nothing next to the title when the host is neither master nor changing state', () => {
  const wrapper = mountHeader(createHost({ current_operations: {} }))

  expect(findHeadBarStatus(wrapper).exists()).toBe(false)
})
