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

// Use as `mockModule(import('@core/composables/collapse-on-overflow.composable.ts'), () => import('@/test/mock-collapse-on-overflow.ts'))`
export const useCollapseOnOverflow = (() => ({
  collapsedCount: collapseOnOverflowMock.collapsedCount,
  reset: collapseOnOverflowMock.resetCollapsedCount,
})) as unknown as typeof realUseCollapseOnOverflow
