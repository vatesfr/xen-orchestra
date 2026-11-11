import {
  dockerTreeContainerFields,
  type FrontXoDockerEngine,
  type FrontXoDockerTreeContainer,
} from '@/modules/docker/types/docker.type.ts'
import { groupContainersByEngine } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { useTimeoutPoll } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue'

const POLLING_INTERVAL_MS = 30e3

async function fetchContainers(engineIds: FrontXoDockerEngine['id'][]): Promise<FrontXoDockerTreeContainer[]> {
  const filter = `$engine:|(${engineIds.join(' ')})`
  const response = await fetch(
    `${BASE_URL}/docker-containers?filter=${encodeURIComponent(filter)}&fields=${dockerTreeContainerFields.join(',')}`
  )

  // the failing engines are missing from the answer, and reported by their `connectionStatus`
  return response.ok ? response.json() : []
}

/**
 * Containers of the tree view, for the engines given by chunks of at most
 * `docker.maxListedEngines` (one request each), polled.
 *
 * Listing connects to the engines: only for the expanded hosts. No stats.
 */
export function useXoDockerTreeContainerCollection(engineIdChunks: MaybeRefOrGetter<FrontXoDockerEngine['id'][][]>) {
  const containers = shallowRef<FrontXoDockerTreeContainer[]>([])

  const loadedEngineIds = shallowRef(new Set<FrontXoDockerEngine['id']>())

  // a new list of engines restarts the polling, an older answer is ignored
  let generation = 0

  async function execute() {
    const chunks = toValue(engineIdChunks)
    const current = ++generation

    if (chunks.length === 0) {
      containers.value = []
      loadedEngineIds.value = new Set()
      return
    }

    const results = await Promise.all(chunks.map(ids => fetchContainers(ids).catch(() => [])))

    if (current === generation) {
      containers.value = results.flat()
      loadedEngineIds.value = new Set(chunks.flat())
    }
  }

  const { pause, resume } = useTimeoutPoll(execute, POLLING_INTERVAL_MS, { immediate: false, immediateCallback: true })

  watch(
    () => toValue(engineIdChunks).flat().join(),
    () => {
      pause()
      resume()
    },
    { immediate: true }
  )

  return {
    containersByEngine: computed(() => groupContainersByEngine(containers.value)),
    /** engines whose containers have been listed, possibly failing */
    loadedEngineIds,
  }
}
