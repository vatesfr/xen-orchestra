import { mockModule } from '@/test/spy-on-module.ts'
import type { useCollapseOnOverflow as realUseCollapseOnOverflow } from '@core/composables/collapse-on-overflow.composable.ts'
import { ref } from 'vue'

// No layout in a unit test, so nothing overflows on its own: a test sets how many items collapse, reset it in
// `beforeEach`
export const collapseOnOverflowMock = {
  collapsedCount: ref(0),
  // The `reset` the component calls to measure its items again
  resetCollapsedCount: vi.fn(),
  reset() {
    this.collapsedCount.value = 0
    this.resetCollapsedCount.mockReset()
  },
}

// Mocked with `mockCollapseOnOverflow()`
export const useCollapseOnOverflow = (() => ({
  collapsedCount: collapseOnOverflowMock.collapsedCount,
  reset: collapseOnOverflowMock.resetCollapsedCount,
})) as unknown as typeof realUseCollapseOnOverflow

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockCollapseOnOverflow() {
  mockModule(
    import('@core/composables/collapse-on-overflow.composable.ts'),
    () => import('@/test/mock-collapse-on-overflow.ts')
  )
}
