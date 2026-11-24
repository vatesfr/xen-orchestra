import PrivateNetworkInterfacesTable from '@/modules/network/components/form/new/PrivateNetworkInterfacesTable.vue'
import type { PrivateNetworkInterfaceError } from '@/modules/network/form/new-private/use-new-private-network-form.ts'
import type { PrivateNetworkInterface } from '@/modules/network/form/new-private/use-private-network-interface.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { getUiButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { openSelect } from '@core-test/select.ts'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

mockXoCollections('pool', 'pif', 'network')

const POOL = createPool()

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL, createPool({ id: OTHER_POOL_ID })]
})

function createInterfaces(): PrivateNetworkInterface[] {
  return [
    reactive({ key: 'interface-1', pool: POOL.id, pif: undefined }),
    reactive({ key: 'interface-2', pool: undefined, pif: undefined }),
  ]
}

const INTERFACE_ERROR: PrivateNetworkInterfaceError = {
  key: 'interface-2',
  number: 2,
  messages: [t('pool-required'), t('pif-required')],
}

function mountTable({
  canAdd = true,
  errors = [],
  showErrors = false,
}: { canAdd?: boolean; errors?: PrivateNetworkInterfaceError[]; showErrors?: boolean } = {}) {
  return mount(PrivateNetworkInterfacesTable, {
    props: { interfaces: createInterfaces(), canAdd, errors, showErrors, getExcludedPoolIds: () => [] },
    global: createGlobalTestConfig(),
  })
}

type Table = ReturnType<typeof mountTable>

// The last row of the body holds the button adding an interface, not an interface
function findRemoveCells(wrapper: Table) {
  return findTableColumnCells(wrapper, '').slice(0, -1)
}

// A row in error is styled `.error` too: the errors are the items of the error list
function findErrors(wrapper: Table) {
  return wrapper.findAll('li.error')
}

function findErroredRows(wrapper: Table) {
  return wrapper.findAllComponents(VtsRow).map(row => row.props('error'))
}

describe('pif', () => {
  it('offers the PIFs of the selected pool with the network icon and their device', async () => {
    xoCollectionsMock.pifs.value = [
      createPif({ id: 'eth0' as FrontXoPif['id'], $host: POOL.master, device: 'eth0' }),
      createPif({ id: 'eth0.10' as FrontXoPif['id'], $host: POOL.master, device: 'eth0', vlan: 10, physical: false }),
    ]
    const wrapper = mountTable()

    await openSelect(findTableColumnCells(wrapper, t('pif'))[0])

    expect(
      wrapper.findAllComponents(VtsDetailedOption).map(option => ({
        icon: option.props('icon'),
        details: option.props('details'),
      }))
    ).toEqual([
      { icon: 'object:network', details: 'eth0' },
      { icon: 'object:network', details: t('pif-device-vlan', { device: 'eth0', vlan: 10 }) },
    ])
  })
})

describe('remove', () => {
  it('lets every interface but the first be removed', () => {
    expect(findRemoveCells(mountTable()).map(cell => cell.find('button').exists())).toEqual([false, true])
  })

  it('removes the interface whose button is clicked', async () => {
    const wrapper = mountTable()

    await findRemoveCells(wrapper)[1].get('button').trigger('click')

    expect(wrapper.emitted('remove')).toEqual([[1]])
  })
})

describe('add', () => {
  it('adds an interface', async () => {
    const wrapper = mountTable()

    await getUiButton(wrapper, t('new')).trigger('click')

    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('lets an interface be added while some pools are left', () => {
    const wrapper = mountTable()

    expect(getUiButton(wrapper, t('new')).props('disabled')).toBe(false)
    expect(findAccentedInfos(wrapper)).toEqual([])
  })

  it('disables the button and explains why once every pool is selected', () => {
    const wrapper = mountTable({ canAdd: false })

    expect(getUiButton(wrapper, t('new')).props('disabled')).toBe(true)
    expect(findAccentedInfos(wrapper)).toEqual([{ label: t('new-network:all-pools-selected'), accent: 'info' }])
  })
})

describe('errors', () => {
  it('shows neither the errors nor the errored rows before they are to be shown', () => {
    const wrapper = mountTable({ errors: [INTERFACE_ERROR] })

    expect(findErrors(wrapper)).toEqual([])
    expect(findErroredRows(wrapper)).toEqual([false, false])
  })

  it('lists the errors of each interface by its number, and marks its row', () => {
    const wrapper = mountTable({ errors: [INTERFACE_ERROR], showErrors: true })

    const errors = findErrors(wrapper)

    expect(errors).toHaveLength(1)
    expect(errors[0].text()).toContain(t('new-network:interface-number:', { n: 2 }))
    expect(errors[0].findAll('.messages li').map(message => message.text())).toEqual([
      t('pool-required'),
      t('pif-required'),
    ])
    expect(findErroredRows(wrapper)).toEqual([false, true])
  })
})
