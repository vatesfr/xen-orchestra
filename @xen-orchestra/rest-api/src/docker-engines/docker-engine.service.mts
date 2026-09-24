import { inject } from 'inversify'
import type {
  XoDockerEngine,
  XoDockerEngineInfo,
  XoDockerEngineProperties,
  XoDockerEngineTestResult,
} from '@vates/types'

import type { CreateDockerEngineBody, UpdateDockerEngineBody } from './docker-engine.type.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { withDockerErrors } from '../helpers/docker.helper.mjs'

/**
 * Docker engines, reached through SSH by xo-server (`xo-mixins/docker.mjs`)
 *
 * Only the `info` and `test` methods connect. The `DockerError`s are converted
 * to `ApiError`s with the right HTTP status.
 */
export class DockerEngineService {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * Must be called first by every Docker route: an unlicensed XOA must not
   * store credentials nor open SSH sessions.
   */
  assertDockerFeature(): Promise<void> {
    return this.#restApi.xoApp.checkFeatureAuthorization('DOCKER')
  }

  getEngines(): Promise<XoDockerEngine[]> {
    return this.#restApi.xoApp.getAllDockerEngines()
  }

  getEngine(id: XoDockerEngine['id']): Promise<XoDockerEngine> {
    return this.#restApi.xoApp.getDockerEngine(id)
  }

  create(body: CreateDockerEngineBody): Promise<XoDockerEngine> {
    return withDockerErrors(() => this.#restApi.xoApp.createDockerEngine(body as XoDockerEngineProperties))
  }

  update(id: XoDockerEngine['id'], body: UpdateDockerEngineBody): Promise<XoDockerEngine> {
    return withDockerErrors(() => this.#restApi.xoApp.updateDockerEngine(id, body as XoDockerEngineProperties))
  }

  delete(id: XoDockerEngine['id']): Promise<void> {
    return withDockerErrors(() => this.#restApi.xoApp.deleteDockerEngine(id))
  }

  /**
   * Not cached: three requests on the pooled connection, and an unreachable
   * engine fails fast thanks to the pool's negative cache.
   */
  getInfo(id: XoDockerEngine['id']): Promise<XoDockerEngineInfo> {
    return withDockerErrors(() => this.#restApi.xoApp.getDockerEngineInfo(id))
  }

  test(id: XoDockerEngine['id']): Promise<XoDockerEngineTestResult> {
    return withDockerErrors(() => this.#restApi.xoApp.testDockerEngine(id))
  }
}
