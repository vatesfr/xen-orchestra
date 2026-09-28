import type {
  DockerEngineCreatePayload,
  DockerEngineUpdatePayload,
  FrontXoDockerContainer,
  FrontXoDockerEngine,
} from '@/modules/docker/types/docker.type.ts'
import { defineJobArg } from '@core/packages/job'

export type DockerConnectionSaveRequest =
  | { engineId?: undefined; payload: DockerEngineCreatePayload }
  | { engineId: FrontXoDockerEngine['id']; payload: DockerEngineUpdatePayload }

// one connection per VM (creation) or engine (update) at a time
export const xoDockerConnectionSaveArg = defineJobArg<DockerConnectionSaveRequest>({
  toArray: false,
  // the identity is also computed while no request is set (it is reset once saved)
  identify: (request?: DockerConnectionSaveRequest) => {
    if (request === undefined) {
      return undefined
    }

    return request.engineId === undefined ? request.payload.$VM : request.engineId
  },
})

export const xoDockerEngineArg = defineJobArg({
  toArray: false,
  identify: (engine: FrontXoDockerEngine) => engine.id,
})

// the container id: a job runs per row, not globally
export const xoDockerContainerArg = defineJobArg({
  toArray: false,
  identify: (container: FrontXoDockerContainer) => container.id,
})
