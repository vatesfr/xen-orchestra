import type { XoVmDashboard } from '@/types/xo/vm-dashboard.type'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

export const useXoVmDashboard = defineRemoteResource({
  url: (vmId: string) => `/rest/v0/vms/${vmId}/dashboard?ndjson=true`,
  stream: true,
  state: (vmDashboard: Ref<XoVmDashboard | undefined>, context) => ({
    vmDashboard,
    hasError: context.hasError,
    isDashboardReady: context.isReady,
  }),
})
