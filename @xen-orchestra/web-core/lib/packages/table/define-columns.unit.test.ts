import MenuItem from '@core/components/menu/MenuItem.vue'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import type { ColumnSortDirection } from '@core/packages/table/types.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mountComposable } from '@core-test/mount-composable.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Vm = { name: string; description: string; vcpus: number }

const vms: Vm[] = [
  { name: 'Web', description: 'Nginx front', vcpus: 4 },
  { name: 'Database', description: 'PostgreSQL primary', vcpus: 8 },
  { name: 'Backup', description: 'XO proxy', vcpus: 2 },
]

const useVmColumns = defineColumns(() => ({
  name: useTextColumn({ headerLabel: 'Name' }),
  description: useTextColumn({ headerLabel: 'Description' }),
  vcpus: useNumberColumn({ headerLabel: 'vCPUs' }),
}))

function mountVmColumns({
  id,
  initialSort,
}: {
  id?: string
  initialSort?: { id: 'name' | 'vcpus'; direction: ColumnSortDirection }
} = {}) {
  const wrapper = mount(
    defineComponent({
      setup() {
        const { HeadCells, sortItems, toggle } = useVmColumns({
          id,
          body: (vm: Vm) => ({
            name: r => r(vm.name),
            description: r => r(vm.description),
            vcpus: r => r(vm.vcpus),
          }),
          sort: {
            name: (vm1, vm2) => vm1.name.localeCompare(vm2.name),
            vcpus: (vm1, vm2) => vm1.vcpus - vm2.vcpus,
          },
          initialSort,
        })

        return { HeadCells, sortItems, toggle, route: useRoute(), router: useRouter() }
      },
      render() {
        return h('table', [h('thead', [h('tr', [h(this.HeadCells)])])])
      },
    }),
    { global: createGlobalTestConfig() }
  )

  return {
    wrapper,
    readOrder: () => wrapper.vm.sortItems(vms).map(vm => vm.name),
  }
}

async function selectSort(wrapper: ReturnType<typeof mountVmColumns>['wrapper'], label: string, optionIndex: number) {
  const header = wrapper.findAllComponents(UiColumnHeader).find(header => header.text() === label)

  await header!.get('button').trigger('click')
  await flushPromises()
  await wrapper.findAllComponents(MenuItem)[optionIndex].get('[role="menuitem"]').trigger('click')
  await flushPromises()
}

describe('sortItems', () => {
  it('keeps the order of the items without a sort', () => {
    const { readOrder } = mountVmColumns()

    expect(readOrder()).toEqual(['Web', 'Database', 'Backup'])
  })

  it.each([
    { direction: 'asc' as const, expected: ['Backup', 'Web', 'Database'] },
    { direction: 'desc' as const, expected: ['Database', 'Web', 'Backup'] },
  ])('sorts the items in the $direction order of the column', ({ direction, expected }) => {
    const { readOrder } = mountVmColumns({ initialSort: { id: 'vcpus', direction } })

    expect(readOrder()).toEqual(expected)
  })

  it('returns a sorted copy without changing the items', () => {
    const { wrapper } = mountVmColumns({ initialSort: { id: 'name', direction: 'asc' } })
    const items = [...vms]

    wrapper.vm.sortItems(items)

    expect(items).toEqual(vms)
  })

  it('sorts by the direction selected from a column header', async () => {
    const { wrapper, readOrder } = mountVmColumns()

    await selectSort(wrapper, 'Name', 0)

    expect(readOrder()).toEqual(['Backup', 'Database', 'Web'])
  })
})

describe('HeadCells', () => {
  it('makes the headers of the columns with a compare function interactive', () => {
    const { wrapper } = mountVmColumns()

    const headers = wrapper
      .findAllComponents(UiColumnHeader)
      .map(header => [header.text(), header.props('interactive')])

    expect(headers).toEqual([
      ['Name', true],
      ['Description', false],
      ['vCPUs', true],
    ])
  })
})

describe('toggle', () => {
  it('falls back to the initial sort when hiding another sorted column', async () => {
    const { wrapper, readOrder } = mountVmColumns({ initialSort: { id: 'vcpus', direction: 'asc' } })

    await selectSort(wrapper, 'Name', 0)

    wrapper.vm.toggle('name', false)
    await flushPromises()

    expect(readOrder()).toEqual(['Backup', 'Web', 'Database'])
  })

  it('removes the sort when hiding the sorted column', async () => {
    const { wrapper, readOrder } = mountVmColumns({ initialSort: { id: 'vcpus', direction: 'asc' } })

    wrapper.vm.toggle('vcpus', false)
    await flushPromises()

    expect(readOrder()).toEqual(['Web', 'Database', 'Backup'])
  })

  it('keeps the sort when hiding another column', async () => {
    const { wrapper, readOrder } = mountVmColumns({ initialSort: { id: 'vcpus', direction: 'asc' } })

    wrapper.vm.toggle('name', false)
    await flushPromises()

    expect(readOrder()).toEqual(['Backup', 'Web', 'Database'])
  })
})

describe('with an id', () => {
  it('reads the sort from the route query', async () => {
    const { wrapper, readOrder } = mountVmColumns({ id: 'vms' })

    await wrapper.vm.router.push({ query: { 'vms.sort': 'vcpus,desc' } })

    expect(readOrder()).toEqual(['Database', 'Web', 'Backup'])
  })

  it.each(['description,asc', 'unknown,asc', 'vcpus,up', '__proto__,asc', 'constructor,asc', 'toString,asc'])(
    'falls back to the initial sort on the sort %j of a column without a compare function, or malformed',
    async query => {
      const { wrapper, readOrder } = mountVmColumns({ id: 'vms', initialSort: { id: 'vcpus', direction: 'asc' } })

      await wrapper.vm.router.push({ query: { 'vms.sort': query } })

      expect(readOrder()).toEqual(['Backup', 'Web', 'Database'])
    }
  )

  it('keeps no sort when hiding the column of the initial sort', async () => {
    const { wrapper, readOrder } = mountVmColumns({ id: 'vms', initialSort: { id: 'vcpus', direction: 'asc' } })

    wrapper.vm.toggle('vcpus', false)
    await flushPromises()

    expect(readOrder()).toEqual(['Web', 'Database', 'Backup'])
  })

  it('falls back to the initial sort on the sort of a hidden column', async () => {
    const { wrapper, readOrder } = mountVmColumns({ id: 'vms', initialSort: { id: 'vcpus', direction: 'asc' } })

    wrapper.vm.toggle('name', false)
    await wrapper.vm.router.push({ query: { 'vms.sort': 'name,asc' } })

    expect(readOrder()).toEqual(['Backup', 'Web', 'Database'])
  })

  it('removes the sort from the route query when hiding the sorted column', async () => {
    const { wrapper } = mountVmColumns({ id: 'vms' })

    await selectSort(wrapper, 'Name', 0)

    wrapper.vm.toggle('name', false)
    await flushPromises()

    expect(wrapper.vm.route.query['vms.sort']).toBeUndefined()
  })

  it('stores the initial sort when hiding the sorted column while the initial sort column is hidden', async () => {
    const { wrapper, readOrder } = mountVmColumns({ id: 'vms', initialSort: { id: 'vcpus', direction: 'asc' } })

    await selectSort(wrapper, 'Name', 0)

    wrapper.vm.toggle('vcpus', false)
    wrapper.vm.toggle('name', false)
    await flushPromises()

    expect(readOrder()).toEqual(['Web', 'Database', 'Backup'])
    expect(wrapper.vm.route.query['vms.sort']).toBeUndefined()
  })

  it('ignores the sort of an excluded column', async () => {
    const { wrapper } = mountComposable(() => ({
      ...useVmColumns({
        id: 'vms',
        exclude: ['vcpus'],
        body: (vm: Vm) => ({
          name: r => r(vm.name),
          description: r => r(vm.description),
        }),
        sort: { vcpus: (vm1, vm2) => vm1.vcpus - vm2.vcpus },
      }),
      router: useRouter(),
    }))

    await wrapper.vm.router.push({ query: { 'vms.sort': 'vcpus,asc' } })

    expect(wrapper.vm.sortItems(vms).map(vm => vm.name)).toEqual(['Web', 'Database', 'Backup'])
  })

  it('stores the selected sort in the route query', async () => {
    const { wrapper } = mountVmColumns({ id: 'vms' })

    await selectSort(wrapper, 'vCPUs', 1)

    expect(wrapper.vm.route.query['vms.sort']).toBe('vcpus,desc')
  })
})
