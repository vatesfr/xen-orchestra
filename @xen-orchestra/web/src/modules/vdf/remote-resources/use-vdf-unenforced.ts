import type { VdfUnenforced } from '@/modules/vdf/types.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

// vdf#141: hosts that can't enforce while protected VMs run there, in the
// pools whose firewall the user may read. Polled: an agent stops or comes
// back, a VM starts or moves outside XO
export const useVdfUnenforced = defineRemoteResource({
  url: `${BASE_URL}/plugins/vdf/unenforced`,
  pollingIntervalMs: 30_000,
  // each answer is the whole list: replace it (the default deep merge would
  // keep what the server removed)
  onDataReceived: async (data: Ref<VdfUnenforced | undefined>, receivedData: VdfUnenforced) => {
    data.value = receivedData
  },
  state: (unenforced: Ref<VdfUnenforced | undefined>, context) => ({
    unenforced,
    isUnenforcedReady: context.isReady,
  }),
})
