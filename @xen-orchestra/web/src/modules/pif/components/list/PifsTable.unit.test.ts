import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PifsTable from '@/modules/pif/components/list/PifsTable.vue'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { findIconPaths, findNamedIconPaths } from '@/test/find-icon-paths.ts'
import { findTableCell, findTableRows } from '@/test/find-table-rows.ts'
import { createGlobalTestConfig, createGlobalTestConfigAt } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const { useGetNetworkById, getHostById, useGetTaskById } = vi.hoisted(() => ({
  useGetNetworkById: vi.fn(),
  getHostById: vi.fn(),
  useGetTaskById: vi.fn(),
}))

// Read only when the table mounts, so the module-scope refs are already initialized
const arePifsReady = ref(true)
const hasPifFetchError = ref(false)

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: (() => ({ useGetNetworkById })) as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({ arePifsReady, hasPifFetchError })) as unknown as typeof useXoPifCollection,
}))

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById })) as unknown as typeof useXoTaskCollection,
}))

beforeEach(() => {
  useGetNetworkById.mockReset()
  getHostById.mockReset()
  useGetTaskById.mockReset()
  arePifsReady.value = true
  hasPifFetchError.value = false
  useGetNetworkById.mockReturnValue(computed(() => undefined))
})

function mountPifsTable(
  pifs: FrontXoPif[] = [createPif()],
  network?: FrontXoNetwork,
  config = createGlobalTestConfig()
) {
  useGetNetworkById.mockReturnValue(computed(() => network))

  return mount(PifsTable, {
    props: { pifs },
    global: config,
  })
}

async function search(wrapper: ReturnType<typeof mountPifsTable>, query: string) {
  await wrapper.get('.ui-query-search-bar input').setValue(query)
  await wrapper.get('.ui-query-search-bar').trigger('submit')
}

it('shows what the table is about', () => {
  const wrapper = mountPifsTable()

  expect(wrapper.get('.ui-title').text()).toBe(t('pifs'))
})

it('lays out one row per PIF, under the columns it lists', () => {
  const wrapper = mountPifsTable(
    [
      createPif({
        id: 'pif-1' as FrontXoPif['id'],
        device: 'eth0',
        attached: true,
        carrier: true,
        vlan: 42,
        ip: '10.0.0.1',
        ipv6: [],
        mac: 'aa:bb:cc:dd:ee:ff',
        mode: 'Static',
      }),
    ],
    createNetwork({ name_label: 'Management network' })
  )

  expect(findTableRows(wrapper)).toEqual([
    {
      [t('network')]: 'Management network',
      [t('device')]: 'eth0',
      [t('status')]: t('connected'),
      [t('vlan')]: '42',
      [t('ip-address')]: '10.0.0.1',
      [t('mac-address')]: 'aa:bb:cc:dd:ee:ff',
      [t('mode')]: t('static'),
      '': '',
    },
  ])
})

it('leaves the network cell empty when the network is unknown', () => {
  const wrapper = mountPifsTable()

  expect(findTableRows(wrapper)[0]).toMatchObject({ [t('network')]: '' })
})

it('links the network to the networks page of its pool', () => {
  const wrapper = mountPifsTable([createPif()], createNetwork({ id: 'network-1' as FrontXoNetwork['id'] }))

  const link = findTableCell(wrapper, { row: 0, column: t('network') }).get('a')

  expect(link.attributes('href')).toBe('/pool/pool-789/networks?id=network-1')
})

it('reports a PIF without a carrier as disconnected from its physical device', () => {
  const wrapper = mountPifsTable([createPif({ attached: true, carrier: false })])

  expect(findTableRows(wrapper)[0]).toMatchObject({ [t('status')]: t('disconnected-from-physical-device') })
})

it('reports no VLAN when the PIF carries none', () => {
  const wrapper = mountPifsTable([createPif({ vlan: -1 })])

  expect(findTableRows(wrapper)[0]).toMatchObject({ [t('vlan')]: t('none') })
})

it('lists the IPv4 address of a PIF before its IPv6 ones', async () => {
  const wrapper = mountPifsTable([createPif({ ip: '10.0.0.1', ipv6: ['2001:db8::1', '2001:db8::2'] })])

  const cell = findTableCell(wrapper, { row: 0, column: t('ip-address') })

  await cell.get('.more').trigger('click')

  expect(cell.findAll('li').map(item => item.text())).toEqual(['10.0.0.1', '2001:db8::1', '2001:db8::2'])
})

it('shows no address for a PIF that reports none', () => {
  const wrapper = mountPifsTable([createPif({ ip: '', ipv6: [] })])

  expect(findTableRows(wrapper)[0]).toMatchObject({ [t('ip-address')]: '' })
})

it('marks the PIF that carries the management interface, and only it', () => {
  const wrapper = mountPifsTable([
    createPif({ id: 'pif-1' as FrontXoPif['id'], management: true }),
    createPif({ id: 'pif-2' as FrontXoPif['id'], management: false }),
  ])

  expect(findIconPaths(findTableCell(wrapper, { row: 0, column: t('device') }))).toEqual(
    findNamedIconPaths('status:primary-circle')
  )
  expect(findIconPaths(findTableCell(wrapper, { row: 1, column: t('device') }))).toEqual([])
})

it('names a DHCP IP configuration', () => {
  const wrapper = mountPifsTable([createPif({ mode: 'DHCP' })])

  expect(findTableRows(wrapper)[0]).toMatchObject({ [t('mode')]: t('dhcp') })
})

it('names an absent IP configuration', () => {
  const wrapper = mountPifsTable([createPif({ mode: 'None' })])

  expect(findTableRows(wrapper)[0]).toMatchObject({ [t('mode')]: t('none') })
})

it('keeps only the PIFs matching the search', async () => {
  const wrapper = mountPifsTable([
    createPif({ id: 'pif-1' as FrontXoPif['id'], device: 'eth0' }),
    createPif({ id: 'pif-2' as FrontXoPif['id'], device: 'eth1' }),
  ])

  await search(wrapper, 'eth1')

  expect(findTableRows(wrapper).map(row => row[t('device')])).toEqual(['eth1'])
})

it('reports that no PIF was detected when the host has none', () => {
  const wrapper = mountPifsTable([])

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-pif-detected'))
})

it('reports no result when the search matches no PIF', async () => {
  const wrapper = mountPifsTable([createPif({ device: 'eth0' })])

  await search(wrapper, 'eth9')

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-result'))
})

it('waits while the PIFs are still being fetched', () => {
  arePifsReady.value = false

  const wrapper = mountPifsTable()

  expect(wrapper.find('.vts-state-hero .loader').exists()).toBe(true)
})

it('reports the failure when the PIFs could not be fetched', () => {
  hasPifFetchError.value = true

  const wrapper = mountPifsTable()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('highlights the PIF the route points at', async () => {
  const wrapper = mountPifsTable(
    [createPif({ id: 'pif-1' as FrontXoPif['id'] }), createPif({ id: 'pif-2' as FrontXoPif['id'] })],
    undefined,
    await createGlobalTestConfigAt('/?id=pif-2')
  )

  expect(wrapper.findAll('tbody tr').map(row => row.classes('selected'))).toEqual([false, true])
})
