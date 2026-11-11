import type {
  DockerTreeHost,
  FrontXoDockerEngine,
  FrontXoDockerTreeContainer,
} from '@/modules/docker/types/docker.type.ts'
import { getContainerDisplayName, getContainerStateAccent } from '@/modules/docker/utils/xo-docker.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import { VM_POWER_STATE } from '@vates/types'
import { chunk } from 'lodash-es'

// `docker.maxListedEngines`: engines listed at once by `GET /docker-containers`
export const MAX_LISTED_ENGINES = 10

/**
 * The engines attached to a known VM, sorted by VM name
 */
export function getDockerTreeHosts(
  engines: FrontXoDockerEngine[],
  getVmById: (id: FrontXoVm['id']) => FrontXoVm | undefined
): DockerTreeHost[] {
  const hosts: DockerTreeHost[] = []

  for (const engine of engines) {
    const vm = engine.$VM === undefined ? undefined : getVmById(engine.$VM)

    if (vm !== undefined) {
      hosts.push({ id: engine.id, engine, vm, label: vm.name_label })
    }
  }

  return hosts.sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Listing the containers connects to the engine: only for a running VM whose
 * engine is not failing
 */
export function canListContainers({ engine, vm }: Pick<DockerTreeHost, 'engine' | 'vm'>): boolean {
  return vm.power_state === VM_POWER_STATE.RUNNING && engine.connectionStatus !== 'error'
}

/**
 * Engines whose containers are listed in the tree: the expanded hosts which
 * can list them, by requests of at most `MAX_LISTED_ENGINES` engines
 */
export function getEngineIdChunksToLoad(
  hosts: DockerTreeHost[],
  isExpanded: (host: DockerTreeHost) => boolean
): FrontXoDockerEngine['id'][][] {
  return chunk(
    hosts.filter(host => isExpanded(host) && canListContainers(host)).map(host => host.id),
    MAX_LISTED_ENGINES
  )
}

export function groupContainersByEngine(containers: FrontXoDockerTreeContainer[]) {
  const containersByEngine = new Map<FrontXoDockerEngine['id'], FrontXoDockerTreeContainer[]>()

  const sorted = [...containers].sort((a, b) => getContainerDisplayName(a).localeCompare(getContainerDisplayName(b)))

  for (const container of sorted) {
    const engineId = container.$engine as FrontXoDockerEngine['id']
    const list = containersByEngine.get(engineId)

    if (list === undefined) {
      containersByEngine.set(engineId, [container])
    } else {
      list.push(container)
    }
  }

  return containersByEngine
}

export function getDockerHostIcon({ engine, vm }: Pick<DockerTreeHost, 'engine' | 'vm'>): IconName {
  const type = engine.kind === 'podman' ? 'podman-host' : 'docker-host'

  if (vm.power_state !== VM_POWER_STATE.RUNNING) {
    return `object:${type}:halted`
  }

  if (engine.connectionStatus === 'error') {
    return `object:${type}:error`
  }

  return engine.connectionStatus === 'connected' ? `object:${type}:connected` : `object:${type}`
}

const CONTAINER_ICON_BY_ACCENT = {
  success: 'object:container:running',
  warning: 'object:container:warning',
  danger: 'object:container:danger',
  muted: 'object:container:halted',
} as const satisfies Record<ReturnType<typeof getContainerStateAccent>, IconName>

export function getDockerContainerIcon(container: Pick<FrontXoDockerTreeContainer, 'state' | 'health'>): IconName {
  return container.state === 'paused'
    ? 'object:container:paused'
    : CONTAINER_ICON_BY_ACCENT[getContainerStateAccent(container)]
}

/** brand names, not translated: unknown until the engine has been connected to */
export function getDockerEngineKindLabel({ kind }: Pick<FrontXoDockerEngine, 'kind'>): string | undefined {
  return kind === undefined ? undefined : { docker: 'Docker', podman: 'Podman' }[kind]
}
