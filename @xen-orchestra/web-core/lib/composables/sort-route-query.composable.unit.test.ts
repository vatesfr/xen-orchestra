import { type RouteQuerySort, useSortRouteQuery } from '@core/composables/sort-route-query.composable.ts'
import { mountComposable } from '@core-test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { useRoute, useRouter } from 'vue-router'

async function mountSortRouteQuery({
  query,
  defaultSort,
}: { query?: string | string[]; defaultSort?: RouteQuerySort } = {}) {
  const { wrapper } = mountComposable(() => ({
    sort: useSortRouteQuery('vms.sort', defaultSort),
    route: useRoute(),
    router: useRouter(),
  }))

  if (query !== undefined) {
    await wrapper.vm.router.push({ query: { 'vms.sort': query } })
  }

  await flushPromises()

  return wrapper.vm
}

describe('useSortRouteQuery', () => {
  it('reads the sort from the query', async () => {
    const vm = await mountSortRouteQuery({ query: 'vcpus,desc' })

    expect(vm.sort).toEqual({ id: 'vcpus', direction: 'desc' })
  })

  it('reads the first sort of a repeated query', async () => {
    const vm = await mountSortRouteQuery({ query: ['vcpus,desc', 'name,asc'] })

    expect(vm.sort).toEqual({ id: 'vcpus', direction: 'desc' })
  })

  it('falls back to the default sort without a query', async () => {
    const vm = await mountSortRouteQuery({ defaultSort: { id: 'name', direction: 'asc' } })

    expect(vm.sort).toEqual({ id: 'name', direction: 'asc' })
  })

  it('has no sort without a query nor a default sort', async () => {
    const vm = await mountSortRouteQuery()

    expect(vm.sort).toBeUndefined()
  })

  it.each(['', 'vcpus', 'vcpus,up', ',asc'])('ignores the malformed query %j', async query => {
    const vm = await mountSortRouteQuery({ query })

    expect(vm.sort).toBeUndefined()
  })

  it.each(['vcpus', 'vcpus,up', ',asc'])('falls back to the default sort on the malformed query %j', async query => {
    const vm = await mountSortRouteQuery({ query, defaultSort: { id: 'name', direction: 'asc' } })

    expect(vm.sort).toEqual({ id: 'name', direction: 'asc' })
  })

  it('stores the sort in the query', async () => {
    const vm = await mountSortRouteQuery()

    vm.sort = { id: 'vcpus', direction: 'desc' }
    await flushPromises()

    expect(vm.route.query['vms.sort']).toBe('vcpus,desc')
  })

  it('removes the query when the default sort is selected', async () => {
    const vm = await mountSortRouteQuery({ query: 'vcpus,desc', defaultSort: { id: 'name', direction: 'asc' } })

    vm.sort = { id: 'name', direction: 'asc' }
    await flushPromises()

    expect(vm.route.query['vms.sort']).toBeUndefined()
  })

  it('keeps a cleared sort rather than falling back to the default sort', async () => {
    const vm = await mountSortRouteQuery({ defaultSort: { id: 'name', direction: 'asc' } })

    vm.sort = undefined
    await flushPromises()

    expect(vm.sort).toBeUndefined()
  })
})
