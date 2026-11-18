import VmHeader from '@/modules/vm/components/VmHeader.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import { findHeadBarLabel, findHeadBarLoader, getHeadBarActions, getHeadBarIcon } from '@/test/find-header.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { findButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { objectIcon } from '@core/icons'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-task-collection.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
  taskCollectionMock.reset()
})

async function mountHeader(vm: FrontXoVm = createVm({ id: 'vm-42' as FrontXoVm['id'] }), initialPath?: string) {
  const router = createTestRouter()

  if (initialPath !== undefined) {
    await router.push(initialPath)
  }

  return mount(VmHeader, {
    props: { vm },
    global: createGlobalTestConfig({ router }),
  })
}

function findTabs(wrapper: Awaited<ReturnType<typeof mountHeader>>) {
  return wrapper.findAll('.ui-tab-item')
}

it('shows the name of the VM', async () => {
  const wrapper = await mountHeader(createVm({ name_label: 'Web server' }))

  expect(findHeadBarLabel(wrapper)).toBe('Web server')
})

it('lists every tab of the VM, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.text())).toEqual([
    t('dashboard'),
    t('console'),
    t('backups'),
    t('stats'),
    t('system'),
    t('network'),
    t('vdis'),
    t('snapshots'),
    t('tasks'),
  ])
})

it('points every in-app tab at the page of that VM', async () => {
  const wrapper = await mountHeader()

  const inAppHrefs = findTabs(wrapper)
    .filter(tab => tab.element.tagName === 'A')
    .map(tab => tab.attributes('href'))

  expect(inAppHrefs).toEqual([
    '/vm/vm-42/dashboard',
    '/vm/vm-42/console',
    '/vm/vm-42/backups',
    '/vm/vm-42/system',
    '/vm/vm-42/networks',
    '/vm/vm-42/vdis',
    '/vm/vm-42/snapshots',
    '/vm/vm-42/tasks',
  ])
})

it('sends the stats tab to XO 5 rather than to an in-app page', async () => {
  const wrapper = await mountHeader()

  const statsTab = findTabs(wrapper).find(tab => tab.text() === t('stats'))!

  expect(statsTab.element.tagName).not.toBe('A')
  expect(statsTab.get('a').attributes('href')).toBe('https://xo5.example.com/#/vms/vm-42/stats')
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(createVm({ id: 'vm-42' as FrontXoVm['id'] }), '/vm/vm-42/system')

  const activeTabs = findTabs(wrapper)
    .filter(tab => tab.classes('active'))
    .map(tab => tab.text())

  expect(activeTabs).toEqual([t('system')])
})

it('marks no tab as active while no VM page is open', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).filter(tab => tab.classes('active'))).toHaveLength(0)
})

it('offers the quick actions of the VM and the more-actions menu', async () => {
  const wrapper = await mountHeader()

  expect(getHeadBarActions(wrapper).text()).not.toContain(t('action:change-state'))
  expect(getHeadBarActions(wrapper).text()).toContain(t('action:migrate'))
  expect(findButton(getHeadBarActions(wrapper), t('more-actions'))).toBeDefined()
})

it('shows the icon matching the power state of the VM', async () => {
  const wrapper = await mountHeader(createVm({ power_state: VM_POWER_STATE.PAUSED, current_operations: {} }))

  expect(getHeadBarIcon(wrapper).props('name')).toBe(objectIcon('vm', 'paused'))
  expect(findHeadBarLoader(wrapper).exists()).toBe(false)
})

it('shows the pending operation in the tooltip of the busy icon', async () => {
  const wrapper = await mountHeader(createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } }))

  expect(await findTooltipContent(getHeadBarIcon(wrapper).element)).toBe(
    t('operation-in-progress', { operation: t('operation:clean-reboot') })
  )
})

it('shows no tooltip on the icon while another operation is pending', async () => {
  const wrapper = await mountHeader(createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } }))

  expect(await findTooltipContent(getHeadBarIcon(wrapper).element)).toBeUndefined()
})

const PENDING_OPERATION_CASES = [
  {
    name: 'shows the busy icon while the VM is changing state',
    vm: () => createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } }),
    icon: objectIcon('vm', 'busy'),
  },
  {
    name: 'keeps the power state icon and shows a loader next to the title while another operation is pending',
    vm: () =>
      createVm({ power_state: VM_POWER_STATE.RUNNING, current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } }),
    icon: objectIcon('vm', 'running'),
  },
]

for (const { name, vm, icon } of PENDING_OPERATION_CASES) {
  it(name, async () => {
    const wrapper = await mountHeader(vm())

    expect(getHeadBarIcon(wrapper).props('name')).toBe(icon)
    expect(findHeadBarLoader(wrapper, { nextToLabel: true }).exists()).toBe(true)
  })
}
