import { itRendersCardTitle } from '@/test/card-title.ts'
import { HOLD_LOADING } from '@/test/hold-loading.ts'
import { expectLoaderInsteadOf } from '@core-test/expect-loader.ts'
import type { VueWrapper } from '@vue/test-utils'

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

  it.each(loading.collections)(
    `shows a loader instead of ${loading.content} while the %s are still loading`,
    collection => {
      HOLD_LOADING[collection]()

      expectLoaderInsteadOf(mountCard(), loading.find)
    }
  )
}
