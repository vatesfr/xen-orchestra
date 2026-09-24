import { dockerContainerFields, type FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { summarizeContainers } from '@/modules/docker/utils/xo-docker.util.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

/**
 * Containers of an engine, fetched live over SSH (the listing must be scoped:
 * `$engine:<id>`).
 */
export const useXoDockerContainerCollection = defineRemoteResource({
  url: (engineId: string) =>
    `${BASE_URL}/docker-containers?filter=${encodeURIComponent(`$engine:${engineId}`)}&fields=${dockerContainerFields.join(',')}&ndjson=true`,
  stream: true,
  initialData: () => [] as FrontXoDockerContainer[],
  state: (containers, context) => ({
    ...useXoCollectionState(containers, {
      context,
      baseName: 'dockerContainer',
    }),
    // derived from the list, so that the counters always agree with the table
    dockerContainersSummary: computed(() => summarizeContainers(containers.value)),
    reloadDockerContainers: context.forceReload,
  }),
})
