import type {
  DockerEngineCreatePayload,
  DockerEngineUpdatePayload,
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
  identify: (request?: DockerConnectionSaveRequest) =>
    request?.engineId ?? (request?.payload as DockerEngineCreatePayload | undefined)?.$VM,
})

export const xoDockerEngineArg = defineJobArg({
  toArray: false,
  identify: (engine: FrontXoDockerEngine) => engine.id,
})
