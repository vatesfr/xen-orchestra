import { dockerEngineFields, type FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

/**
 * Docker engines matching a filter, e.g. `$VM:<uuid>` for the engine of a VM
 * (an empty list means that the VM has no engine configured).
 *
 * Cheap: reading engines never opens an SSH connection.
 */
export const useXoDockerEngineCollection = defineRemoteResource({
  url: (filter: string) =>
    `${BASE_URL}/docker-engines?filter=${encodeURIComponent(filter)}&fields=${dockerEngineFields.join(',')}`,
  initialData: () => [] as FrontXoDockerEngine[],
  // the payload is a plain array: assign it, a deep merge would keep stale keys
  onDataReceived: async (data, receivedData) => {
    data.value = receivedData
  },
  state: (engines, context) => ({
    ...useXoCollectionState(engines, {
      context,
      baseName: 'dockerEngine',
    }),
    // one engine per VM in v1
    dockerEngine: computed(() => engines.value[0]),
    reloadDockerEngines: context.forceReload,
  }),
})
