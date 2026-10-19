import V2vRememberedConnectionItem from '@/modules/v2v/components/source/V2vRememberedConnectionItem.vue'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vRememberedConnection } from '@/test/create-v2v-connection.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { findParts } from '@/test/find-parts.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { mount } from '@vue/test-utils'
import { omit } from 'lodash-es'

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  vmCollectionMock.reset()
})

function mountItem(connection: V2vRememberedConnection = createV2vRememberedConnection(), disabled = false) {
  return mount(V2vRememberedConnectionItem, {
    props: { connection, disabled },
    global: createGlobalTestConfig(),
  })
}

async function openMenu(wrapper: ReturnType<typeof mountItem>) {
  await wrapper.getComponent(UiButtonIcon).trigger('click')

  return wrapper.findAllComponents(MenuItem)
}

async function listMenuLabels(wrapper: ReturnType<typeof mountItem>) {
  const items = await openMenu(wrapper)

  return items.map(item => item.text())
}

it('shows the host with its platform', () => {
  const wrapper = mountItem(createV2vRememberedConnection({ host: 'vcenter-prod.lab' }))

  expect(wrapper.get('.title').text()).toBe(`vcenter-prod.lab ${t('vmware')}`)
})

it('describes the product, the username, the last use and the SSL choice', () => {
  const connection = createV2vRememberedConnection({ skipSslCheck: true })
  const wrapper = mountItem(connection)
  const relativeTime = wrapper.getComponent(VtsRelativeTime)

  expect(findParts(wrapper, '.description')).toEqual([
    `${connection.product} ${connection.version}`,
    connection.username,
    t('used-relative-time', { time: relativeTime.text() }),
    t('ssl-check-skipped'),
  ])
  expect(relativeTime.props('date')).toBe(connection.lastUsedAt)
})

it.each([
  ['VMware vCenter Server', 'fa:building'],
  ['VMware ESXi', 'fa:server'],
])('shows the kind of the %s source', (product, icon) => {
  const wrapper = mountItem(createV2vRememberedConnection({ product }))

  expect(wrapper.getComponent(VtsIcon).props('name')).toBe(icon)
})

it('only describes the username of a connection never used, checking SSL, without known product', () => {
  const connection = omit(createV2vRememberedConnection({ skipSslCheck: false }), 'product', 'lastUsedAt')

  expect(findParts(mountItem(connection), '.description')).toEqual([connection.username])
})

it('shows the VM count and the migration progress of the source', () => {
  vmCollectionMock.vms.value = [
    createV2vImportVm({ isWarm: false }, { id: 'xo-vm-1' as FrontXoVm['id'] }),
    createV2vImportVm({ isWarm: true }, { id: 'xo-vm-2' as FrontXoVm['id'] }),
  ]

  expect(findParts(mountItem(createV2vRememberedConnection({ vmCount: 148 })), '.stats')).toEqual([
    t('n-vms', { n: 148 }),
    t('n-migrated', { n: 1 }),
    t('n-partially-migrated', { n: 1 }),
  ])
})

it('shows the migration progress without a VM count when the VM count is unknown', () => {
  expect(findParts(mountItem(omit(createV2vRememberedConnection(), 'vmCount')), '.stats')).toEqual([
    t('n-migrated', { n: 0 }),
    t('n-partially-migrated', { n: 0 }),
  ])
})

it('shows no stats for a source never connected to', () => {
  const wrapper = mountItem(omit(createV2vRememberedConnection(), 'sourceId', 'vmCount'))

  expect(wrapper.find('.stats').exists()).toBe(false)
})

it('emits connect with the connection', async () => {
  const connection = createV2vRememberedConnection()
  const wrapper = mountItem(connection)

  await wrapper.getComponent(UiButton).trigger('click')

  expect(wrapper.emitted('connect')).toEqual([[connection]])
})

it('cannot connect when disabled', () => {
  expect(mountItem(createV2vRememberedConnection(), true).getComponent(UiButton).props('disabled')).toBe(true)
})

it('offers to edit, forget the password and forget the connection', async () => {
  expect(await listMenuLabels(mountItem())).toEqual([t('action:edit'), t('action:forget-password'), t('action:forget')])
})

it('does not offer to forget a password that is not remembered', async () => {
  const labels = await listMenuLabels(mountItem(omit(createV2vRememberedConnection(), 'password')))

  expect(labels).toEqual([t('action:edit'), t('action:forget')])
})

it.each([
  [0, 'edit'],
  [1, 'forgetPassword'],
  [2, 'forget'],
] as const)('emits the action of the menu item %i (%s) with the connection', async (index, event) => {
  const connection = createV2vRememberedConnection()
  const wrapper = mountItem(connection)
  const items = await openMenu(wrapper)

  await items[index].get('.menu-trigger').trigger('click')

  expect(wrapper.emitted(event)).toEqual([[connection]])
})
