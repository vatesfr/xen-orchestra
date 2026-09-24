import type { FrontXoDockerEngineInfo } from '@/modules/docker/types/docker.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

/**
 * Live information about an engine. Connects to it over SSH: always answers 200,
 * `status` telling whether the engine could be reached.
 */
export const useXoDockerEngineInfo = defineRemoteResource({
  url: (engineId: string) => `${BASE_URL}/docker-engines/${engineId}/info`,
  // the shape changes with the status: assign, a deep merge would keep stale keys
  onDataReceived: async (data: Ref<FrontXoDockerEngineInfo | undefined>, receivedData) => {
    data.value = receivedData
  },
  state: (dockerEngineInfo: Ref<FrontXoDockerEngineInfo | undefined>, context) => ({
    dockerEngineInfo,
    isDockerEngineInfoReady: context.isReady,
    hasDockerEngineInfoError: context.hasError,
    reloadDockerEngineInfo: context.forceReload,
  }),
})
