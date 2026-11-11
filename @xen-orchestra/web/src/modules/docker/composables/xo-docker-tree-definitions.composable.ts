import { isFeatureUnauthorizedError } from '@/modules/docker/composables/use-docker-capability.composable.ts'
import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import { useXoDockerTreeContainerCollection } from '@/modules/docker/remote-resources/use-xo-docker-tree-container-collection.ts'
import { CONTAINERS_ROOT_ID, type DockerTreeHost, type XoContainersRoot } from '@/modules/docker/types/docker.type.ts'
import { getDockerTreeHosts, getEngineIdChunksToLoad } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import { getContainerDisplayName } from '@/modules/docker/utils/xo-docker.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import type { TreeNodeId } from '@core/packages/tree/types.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** id of the tree node of a host, see `TreeNodeBase#id` */
export const getDockerHostNodeId = (host: Pick<DockerTreeHost, 'id'>): TreeNodeId =>
  `containers.docker-hosts.${host.id}`

/**
 * The containers branch of the tree view: the VMs running an engine, then
 * their containers, listed only for the expanded hosts (it connects to their
 * engines). Absent without engine, or when they cannot be read (e.g. XOA plan).
 *
 * @param isHostExpanded by the id of its tree node
 */
export function useXoDockerTreeDefinitions(
  predicate: (node: TreeNodeBase) => boolean | undefined,
  isHostExpanded: (nodeId: TreeNodeId) => boolean
) {
  const { t } = useI18n()

  // all the engines: reading them never connects
  const { dockerEngines, lastDockerEngineFetchError } = useXoDockerEngineCollection({}, '')

  const { getVmById } = useXoVmCollection()

  const hosts = computed(() =>
    isFeatureUnauthorizedError(lastDockerEngineFetchError.value)
      ? []
      : getDockerTreeHosts(dockerEngines.value, getVmById)
  )

  const hostNodeIds = computed(() => hosts.value.map(getDockerHostNodeId))

  const { containersByEngine, loadedEngineIds } = useXoDockerTreeContainerCollection(() =>
    getEngineIdChunksToLoad(hosts.value, host => isHostExpanded(getDockerHostNodeId(host)))
  )

  const root = computed<XoContainersRoot>(() => ({ id: CONTAINERS_ROOT_ID, type: 'containers', name: t('containers') }))

  const definitions = computed(() =>
    hosts.value.length === 0
      ? []
      : defineTree(
          'containers',
          [root.value],
          {
            getLabel: 'name',
            discriminator: 'containers',
          },
          () =>
            defineTree(
              'docker-hosts',
              hosts.value.map(host => ({ ...host, containersLoaded: loadedEngineIds.value.has(host.id) })),
              {
                predicate,
                discriminator: 'docker-host',
              },
              host =>
                defineTree('docker-containers', containersByEngine.value.get(host.id) ?? [], {
                  getLabel: getContainerDisplayName,
                  predicate,
                  discriminator: 'docker-container',
                })
            )
        )
  )

  return {
    definitions,
    hostNodeIds,
  }
}
