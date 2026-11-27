import type { useXoV2vStatus as realUseXoV2vStatus } from '@/modules/v2v/remote-resources/use-xo-v2v-status.ts'
import type { V2vPrerequisiteState } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { ref } from 'vue'

// Shared state of the mocked V2V status: a test sets the prerequisite it needs, reset it in `beforeEach`
export const v2vStatusMock = {
  canConnectV2vSource: ref(true),
  v2vPrerequisite: ref<V2vPrerequisiteState>({ state: 'ok' }),
  reset() {
    this.canConnectV2vSource.value = true
    this.v2vPrerequisite.value = { state: 'ok' }
  },
}

// Mocked with `mockXoV2vStatus()`
export const useXoV2vStatus = (() => ({
  canConnectV2vSource: v2vStatusMock.canConnectV2vSource,
  v2vPrerequisite: v2vStatusMock.v2vPrerequisite,
})) as unknown as typeof realUseXoV2vStatus

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockXoV2vStatus() {
  mockModule(
    import('@/modules/v2v/remote-resources/use-xo-v2v-status.ts'),
    () => import('@/test/mock-xo-v2v-status.ts')
  )
}
