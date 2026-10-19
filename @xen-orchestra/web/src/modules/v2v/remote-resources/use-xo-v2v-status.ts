import { getV2vPrerequisiteState } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoV2vStatus } from '@vates/types'
import { computed } from 'vue'

export const useXoV2vStatus = defineRemoteResource({
  url: `${BASE_URL}/v2v/status`,
  pollingIntervalMs: false,
  initialData: () => undefined as XoV2vStatus | undefined,
  state: (status, context) => {
    const v2vPrerequisite = computed(() =>
      getV2vPrerequisiteState({
        status: status.value,
        hasError: context.hasError.value,
      })
    )

    return {
      v2vPrerequisite,
      canConnectV2vSource: computed(() => v2vPrerequisite.value.state === 'ok'),
    }
  },
})
