import type { XoVmDashboard } from '@/modules/vm/types/vm-dashboard.type'
import { BASE_URL } from '@/shared/utils/fetch.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

export const useXoVmDashboard = defineRemoteResource({
  url: (vmId: string) => `${BASE_URL}/vms/${vmId}/dashboard?ndjson=true`,
  stream: true,
  state: (vmDashboard: Ref<XoVmDashboard | undefined>, context) => ({
    vmDashboard,
    hasError: context.hasError,
    isDashboardReady: context.isReady,
  }),
})
