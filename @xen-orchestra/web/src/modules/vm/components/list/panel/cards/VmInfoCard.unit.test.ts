import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import VmTagsEditor from '@/modules/vm/components/tags/VmTagsEditor.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { itShowsNameAndIdTitle } from '@/test/card-title.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues, findCardRowLabels, findTags } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleIcon } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { userResourceMock, mockXoUser } from '@/test/mock-xo-user.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { itShowsVmCreator } from '@/test/vm-creator.ts'
import { objectIcon } from '@core/icons'
import { HOST_POWER_STATE, VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoCollections('host', 'pool', 'vmTemplate')

mockXoVmCollection()

mockXoUser()

mockXoRoutes()

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

itShowsNameAndIdTitle(() => mountInfoCard(createVm({ name_label: 'Web server', id: 'vm-42' as FrontXoVm['id'] })), {
  label: 'Web server',
  id: 'vm-42',
})

it('shows the busy icon in the card title while the VM power state is changing', () => {
  const wrapper = mountInfoCard(
    createVm({ power_state: VM_POWER_STATE.RUNNING, current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } })
  )

  expect(findPanelCardTitleIcon(wrapper).icon).toBe(objectIcon('vm', 'busy'))
})

it('shows the pending operation in the tooltip of the busy icon of the card title', () => {
  const wrapper = mountInfoCard(createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } }))

  expect(findPanelCardTitleIcon(wrapper).tooltip).toBe(
    t('operation-in-progress', { operation: t('operation:clean-reboot') })
  )
})

it('lists every row of the card, in order', () => {
  const wrapper = mountInfoCard()

  expect(findCardRowLabels(wrapper)).toEqual([
    t('state'),
    t('description'),
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

it('renders the tags between the description and the pool', () => {
  const wrapper = mountInfoCard()

  const rowLabels = wrapper
    .findAll('.content > .vts-card-row-key-value .key, .content > .vm-tags-editor .label')
    .map(label => label.text())

  expect(rowLabels.slice(0, 4)).toEqual([t('state'), t('description'), t('tags'), t('pool')])
})

it('renders one tag per VM tag, in alphabetical order', () => {
  const wrapper = mountInfoCard(createVm({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['billing', 'production'])
})

it('edits the tags of the VM from an icon-only button', () => {
  expect(mountInfoCard().getComponent(VmTagsEditor).props('iconOnly')).toBe(true)
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
