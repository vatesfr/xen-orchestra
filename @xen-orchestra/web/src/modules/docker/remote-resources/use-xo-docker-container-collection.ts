import { dockerContainerFields, type FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { summarizeContainers } from '@/modules/docker/utils/xo-docker.util.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useTimeoutFn } from '@vueuse/core'
import { computed, watch } from 'vue'

// the stats sampler needs two samples, one second apart, before the CPU usage is known
export const DOCKER_STATS_PENDING_RETRY_MS = 3e3

/**
 * Containers of an engine, fetched live over SSH (the listing must be scoped:
 * `$engine:<id>`), with their latest stats (`stats=true`).
 *
 * Not streamed: a streamed fetch empties the list before refilling it, which
 * would make the table blink and unmount the side panel of the selected
 * container on every poll. The payload is a plain array, assigned as is.
 */
export const useXoDockerContainerCollection = defineRemoteResource({
  url: (engineId: string) =>
    `${BASE_URL}/docker-containers?filter=${encodeURIComponent(`$engine:${engineId}`)}&fields=${dockerContainerFields.join(',')}&stats=true`,
  initialData: () => [] as FrontXoDockerContainer[],
  onDataReceived: async (data, receivedData) => {
    data.value = receivedData
  },
  state: (containers, context) => {
    // the sampler has just started: fetch again soon rather than at the next poll
    const { start: retrySoon } = useTimeoutFn(() => context.forceReload(), DOCKER_STATS_PENDING_RETRY_MS, {
      immediate: false,
    })

    watch(containers, () => {
      if (containers.value.some(container => container.statsPending === true)) {
        retrySoon()
      }
    })

    return {
      ...useXoCollectionState(containers, {
        context,
        baseName: 'dockerContainer',
      }),
      // derived from the list, so that the counters always agree with the table
      dockerContainersSummary: computed(() => summarizeContainers(containers.value)),
      reloadDockerContainers: context.forceReload,
    }
  },
})
