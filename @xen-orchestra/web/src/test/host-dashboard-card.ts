import { itRendersCardTitle } from '@/test/card-title.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { expectLoaderInsteadOf } from '@core-test/expect-loader.ts'
import type { VueWrapper } from '@vue/test-utils'

// Holds a mocked collection as still loading (`mock-xo-collections.ts`, `mock-xo-vm-collection.ts`), by its name
export const HOLD_LOADING = {
  hosts: () => {
    xoCollectionsMock.areHostsReady.value = false
  },
  VMs: () => {
    vmCollectionMock.areVmsReady.value = false
  },
  SRs: () => {
    xoCollectionsMock.areSrsReady.value = false
  },
}

type HostDashboardCardCase = {
  title: string
  // The collections the card waits for, in the test names (`mock-xo-collections.ts`, `mock-xo-vm-collection.ts`),
  // what its loader stands for, in the test names, and how to read that content, empty while a collection loads
  loading?: { collections: (keyof typeof HOLD_LOADING)[]; content: string; find: (wrapper: VueWrapper) => unknown[] }
}

/**
 * Registers the tests every card of the host dashboard shares: its title, then a loader instead of its content while
 * each collection it waits for is still loading. The test file resets the collection mocks before each test.
 */
export function itShowsHostDashboardCard(mountCard: () => VueWrapper, { title, loading }: HostDashboardCardCase) {
  itRendersCardTitle(mountCard, title)

  if (loading === undefined) {
    return
  }

  for (const collection of loading.collections) {
    it(`shows a loader instead of ${loading.content} while the ${collection} are still loading`, () => {
      HOLD_LOADING[collection]()

      expectLoaderInsteadOf(mountCard(), loading.find)
    })
  }
}
