import {
  Delete,
  Example,
  Extension,
  Get,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoDockerContainer, XoDockerContainerAction, XoDockerContainerListError, XoDockerLogs } from '@vates/types'

import { DockerContainerService } from './docker-container.service.mjs'
import { DockerEngineService } from '../docker-engines/docker-engine.service.mjs'
import {
  asynchronousActionResp,
  badGatewayResp,
  badRequestResp,
  featureUnauthorized,
  gatewayTimeoutResp,
  incorrectStateResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  serviceUnavailableResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import {
  dockerContainer,
  dockerContainerIds,
  dockerContainerLogs,
  dockerContainersWithErrors,
  partialDockerContainers,
} from '../open-api/oa-examples/docker-container.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { NdjsonStream, WithHref } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

/**
 * JSON response of the scoped listing
 */
export type DockerContainerListResponse = {
  /** hrefs, or objects with `fields` */
  containers: string[] | WithHref<Partial<Unbrand<XoDockerContainer>>>[]
  /** engines which failed: their containers are missing */
  errors: XoDockerContainerListError[]
  /** ms since the epoch of the oldest fetch */
  asOf: number
}

// v1: no `acl` middleware, so every route is admin-only (see the README's
// ACLs section). The `// ACLs v2:` comments give the middleware to add with the
// `docker-container` ACL resource.
@Route('docker-containers')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Response(featureUnauthorized.status, featureUnauthorized.description)
@Tags('docker-containers')
@provide(DockerContainerController)
export class DockerContainerController extends XoController<XoDockerContainer> {
  #dockerContainerService: DockerContainerService
  #dockerEngineService: DockerEngineService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(DockerContainerService) dockerContainerService: DockerContainerService,
    @inject(DockerEngineService) dockerEngineService: DockerEngineService
  ) {
    super('docker-container', restApi)
    this.#dockerContainerService = dockerContainerService
    this.#dockerEngineService = dockerEngineService
  }

  // --- abstract methods

  // there is no unscoped listing: requires a filter designating the engines
  async getAllCollectionObjects({ filter }: { filter?: string }): Promise<XoDockerContainer[]> {
    return (await this.#dockerContainerService.list({ filter })).containers
  }
  getCollectionObject(id: XoDockerContainer['id']): Promise<XoDockerContainer> {
    return this.#dockerContainerService.getContainer(id)
  }

  /**
   * Last lines of the logs of a container, bounded: at most `tail` lines
   * (default 100, max `docker.maxLogsTail`), and cut at `docker.maxLogsSize`
   * (`truncated: true`).
   *
   * Logs routinely contain secrets.
   *
   * Required privilege:
   * - admin (v2: resource: docker-container, action: read-logs)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   * @example tail 100
   * @example since "2026-09-24T12:00:00Z"
   * @example until "1790265600000"
   * @example stdout true
   * @example stderr true
   * @example timestamps true
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'read-logs', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(dockerContainerLogs)
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/logs')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  async getDockerContainerLogs(
    @Path() id: string,
    /** number of lines from the end */
    @Query() tail?: number,
    /** ms since the epoch or a date string */
    @Query() since?: string,
    /** ms since the epoch or a date string */
    @Query() until?: string,
    @Query() stdout?: boolean,
    @Query() stderr?: boolean,
    @Query() timestamps?: boolean
  ): Promise<XoDockerLogs> {
    await this.#dockerEngineService.assertDockerFeature()
    return this.#dockerContainerService.getLogs(id as XoDockerContainer['id'], {
      tail,
      since,
      until,
      stdout,
      stderr,
      timestamps,
    })
  }

  /**
   * The container, inspected (served from the listing cache when possible).
   *
   * Required privilege:
   * - admin (v2: resource: docker-container, action: read)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'read', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(dockerContainer)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  async getDockerContainer(@Path() id: string): Promise<Unbrand<XoDockerContainer>> {
    await this.#dockerEngineService.assertDockerFeature()
    return this.getObject(id as XoDockerContainer['id'])
  }

  /**
   * Containers of the Docker engines designated by `filter`: it must contain
   * an equality term on `$engine`, `$VM` or `$pool` (e.g. `$VM:<uuid>`,
   * `$engine:|(<id1> <id2>)`) resolving to at most `docker.maxListedEngines`
   * engines (default 10), else 422. The whole filter is then applied to the
   * containers.
   *
   * Connects to the engines (results cached `docker.cacheExpiresIn`). An engine
   * which fails does not fail the request: its containers are missing, and the
   * JSON response lists it in `errors` (not reported with `ndjson` or
   * `markdown`, which only stream the containers).
   *
   * Required privilege:
   * - admin (v2: resource: docker-container, action: read, per container)
   *
   * @example fields "id,name,state,status,image"
   * @example filter "$engine:39a3cb1f-02ef-48ad-bda6-a3baf33d458c state:running"
   * @example limit 42
   * @example all true
   */
  // ACLs v2: @Security('*', ['acl']) + sendObjects(…, { privilege: { action: 'read', resource: 'docker-container' } })
  @Example(dockerContainerIds)
  @Example(partialDockerContainers)
  @Example(dockerContainersWithErrors)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Response(invalidParameters.status, 'The filter does not designate engines, or too many')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  async getDockerContainers(
    @Request() req: ExRequest,
    @Query() filter?: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() limit?: number,
    /** include stopped containers, default true */
    @Query() all?: boolean,
    /** not supported yet (422) */
    @Query() stats?: boolean
  ): Promise<DockerContainerListResponse | NdjsonStream | string> {
    await this.#dockerEngineService.assertDockerFeature()
    const { containers, errors, asOf } = await this.#dockerContainerService.list({ filter, all, stats })
    const result = await this.sendObjects(containers, req, { limit })
    if (typeof result === 'string' || !Array.isArray(result)) {
      // ndjson or markdown
      return result
    }
    return { containers: result as DockerContainerListResponse['containers'], errors, asOf }
  }

  /**
   * Required privilege:
   * - admin (v2: resource: docker-container, action: start)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'start', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/start')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, 'Started, or already running (synchronous call)')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code, synchronous call)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  startDockerContainer(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    return this.#action(id, 'start', sync)
  }

  /**
   * Required privilege:
   * - admin (v2: resource: docker-container, action: stop)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'stop', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/stop')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, 'Stopped, or already stopped (synchronous call)')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code, synchronous call)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  stopDockerContainer(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    return this.#action(id, 'stop', sync)
  }

  /**
   * Required privilege:
   * - admin (v2: resource: docker-container, action: restart)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'restart', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/restart')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, 'Restarted (synchronous call)')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code, synchronous call)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  restartDockerContainer(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    return this.#action(id, 'restart', sync)
  }

  /**
   * Required privilege:
   * - admin (v2: resource: docker-container, action: pause)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'pause', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/pause')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, 'Paused (synchronous call)')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, 'Not running, or already paused (synchronous call)')
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code, synchronous call)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  pauseDockerContainer(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    return this.#action(id, 'pause', sync)
  }

  /**
   * Required privilege:
   * - admin (v2: resource: docker-container, action: unpause)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'unpause', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/unpause')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, 'Unpaused (synchronous call)')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, 'Not paused (synchronous call)')
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code, synchronous call)')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  unpauseDockerContainer(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    return this.#action(id, 'unpause', sync)
  }

  /**
   * Remove the container from its Docker host.
   *
   * Always synchronous.
   *
   * Required privilege:
   * - admin (v2: resource: docker-container, action: delete)
   *
   * @example id "39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e"
   * @example force false
   * @example removeVolumes false
   */
  // ACLs v2: acl({ resource: 'docker-container', action: 'delete', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerContainer })
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, 'The container is running and force is not set')
  @Response(badGatewayResp.status, 'SSH or Docker failure (see data.code)')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  async deleteDockerContainer(
    @Path() id: string,
    /** kill the container first if it is running */
    @Query() force?: boolean,
    /** also remove its anonymous volumes */
    @Query() removeVolumes?: boolean
  ): Promise<void> {
    await this.#dockerEngineService.assertDockerFeature()
    const containerId = id as XoDockerContainer['id']
    await this.#dockerContainerService.assertContainerId(containerId)
    await this.createAction<void>(
      async () => {
        await this.#dockerContainerService.delete(containerId, { force, removeVolumes })
      },
      {
        sync: true,
        statusCode: noContentResp.status,
        taskProperties: {
          name: 'delete Docker container',
          objectId: containerId,
          params: { force, removeVolumes },
        },
      }
    )
  }

  async #action(id: string, action: XoDockerContainerAction, sync?: boolean): CreateActionReturnType<void> {
    await this.#dockerEngineService.assertDockerFeature()
    const containerId = id as XoDockerContainer['id']
    // 404 before creating a task (without connecting: only the engine is checked)
    await this.#dockerContainerService.assertContainerId(containerId)
    return this.createAction<void>(
      async () => {
        await this.#dockerContainerService.runAction(containerId, action)
      },
      {
        sync,
        statusCode: noContentResp.status,
        taskProperties: { name: `${action} Docker container`, objectId: containerId },
      }
    )
  }
}
