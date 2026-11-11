import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const CONTAINERS_TAB_PATH = /^\/vm\/([^/]+)\/containers$/

/**
 * The container host whose Containers tab is shown (the engine of that VM) and
 * the container selected in it (`?id=`): the tree highlights their rows instead
 * of the VM's
 */
export function useDockerHostRoute() {
  const route = useRoute()

  const { dockerEngines } = useXoDockerEngineCollection({}, '')

  const routeEngine = computed(() => {
    const vmId = CONTAINERS_TAB_PATH.exec(route.path)?.[1]

    return vmId === undefined ? undefined : dockerEngines.value.find(engine => engine.$VM === vmId)
  })

  const selectedContainerId = computed(() => (typeof route.query.id === 'string' ? route.query.id : undefined))

  return { routeEngine, selectedContainerId }
}
