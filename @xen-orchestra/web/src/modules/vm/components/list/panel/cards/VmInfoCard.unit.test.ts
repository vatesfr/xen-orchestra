import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues, findCardRowLabels, findTags } from '@/test/find-rendered-values.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { userResourceMock } from '@/test/mock-xo-user.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { itShowsVmCreator } from '@/test/vm-creator.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { objectIcon } from '@core/icons'
import { HOST_POWER_STATE, VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockModule(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
  userResourceMock.reset()
})

function createTemplate(overrides: Partial<FrontXoVmTemplate> = {}) {
  return {
    id: 'template-1',
    uuid: 'template-uuid-1',
    name_label: 'Debian 12',
    $pool: 'pool-789',
    ...overrides,
  } as FrontXoVmTemplate
}

function mountInfoCard(vm: FrontXoVm = createVm()) {
  return mount(VmInfoCard, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the name and the id of the VM as the card title', () => {
  const wrapper = mountInfoCard(createVm({ name_label: 'Web server', id: 'vm-42' as FrontXoVm['id'] }))

  expect(wrapper.get('.ui-panel-card-title').text()).toContain('Web server')
  expect(wrapper.get('.ui-panel-card-title').text()).toContain('vm-42')
})

it('shows the busy icon in the card title while the VM power state is changing', () => {
  const wrapper = mountInfoCard(
    createVm({ power_state: VM_POWER_STATE.RUNNING, current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } })
  )

  expect(wrapper.getComponent(UiPanelCardTitle).getComponent(VtsIcon).props('name')).toBe(objectIcon('vm', 'busy'))
})

it('shows the pending operation in the tooltip of the busy icon of the card title', async () => {
  const wrapper = mountInfoCard(createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } }))

  expect(await findTooltipContent(wrapper.getComponent(UiPanelCardTitle).getComponent(VtsIcon).element)).toBe(
    t('operation-in-progress', { operation: t('operation:clean-reboot') })
  )
})

it('lists every row of the card, in order', () => {
  const wrapper = mountInfoCard()

  expect(findCardRowLabels(wrapper)).toEqual([
    t('state'),
    t('description'),
    t('tags'),
    t('pool'),
    t('host'),
    t('os-name'),
    t('guest-tools'),
    t('template'),
    t('created-on'),
    t('created-by'),
    t('started'),
  ])
})

it('shows the power state, description and OS name of the VM', () => {
  const wrapper = mountInfoCard(
    createVm({
      power_state: VM_POWER_STATE.HALTED,
      name_description: 'Serves the website',
      os_version: { name: 'Debian Bookworm' } as FrontXoVm['os_version'],
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('state')]: t('vm:status:halted'),
    [t('description')]: 'Serves the website',
    [t('os-name')]: 'Debian Bookworm',
  })
})

it('renders one tag per VM tag', () => {
  const wrapper = mountInfoCard(createVm({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['production', 'billing'])
})

const POOL_AND_HOST_CASES = [
  {
    name: 'shows the name of the pool hosting the VM',
    seed: () => {
      xoCollectionsMock.pools.value = [createPool({ name_label: 'Production Pool' })]
    },
    label: t('pool'),
    value: 'Production Pool',
  },
  { name: 'leaves the pool row empty when the pool is unknown', label: t('pool'), value: '' },
  {
    name: 'shows the name of the host running the VM',
    seed: () => {
      xoCollectionsMock.hosts.value = [
        createHost({ name_label: 'Primary Host', power_state: HOST_POWER_STATE.RUNNING }),
      ]
    },
    label: t('host'),
    value: 'Primary Host',
  },
  { name: 'leaves the host row empty when the VM runs on no host', label: t('host'), value: '' },
]

for (const { name, seed, label, value } of POOL_AND_HOST_CASES) {
  it(name, () => {
    seed?.()

    expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ [label]: value })
  })
}

it('shows the name of the template the VM was created from', () => {
  xoCollectionsMock.templates.value = [createTemplate()]

  const wrapper = mountInfoCard(
    createVm({
      $pool: 'pool-789' as FrontXoVm['$pool'],
      creation: { template: 'template-uuid-1' } as FrontXoVm['creation'],
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('template')]: 'Debian 12' })
})

it('ignores a same-uuid template belonging to another pool', () => {
  xoCollectionsMock.templates.value = [createTemplate({ $pool: 'pool-other' as FrontXoVmTemplate['$pool'] })]

  const wrapper = mountInfoCard(
    createVm({
      $pool: 'pool-789' as FrontXoVm['$pool'],
      creation: { template: 'template-uuid-1' } as FrontXoVm['creation'],
      other: { base_template_name: 'Debian 12 (removed)' },
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('template')]: 'Debian 12 (removed)' })
})

itShowsVmCreator(() => findCardLabelledValues(mountInfoCard()), { withEmailFallback: true })
