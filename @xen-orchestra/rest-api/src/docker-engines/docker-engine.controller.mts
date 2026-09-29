import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
  Middlewares,
  Patch,
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
import { type Request as ExRequest, json } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type {
  XoDockerEngine,
  XoDockerEngineInfo,
  XoDockerEngineProperties,
  XoDockerEngineTestResult,
} from '@vates/types'

import type { CreateDockerEngineBody, UpdateDockerEngineBody } from './docker-engine.type.mjs'
import {
  asynchronousActionResp,
  badGatewayResp,
  badRequestResp,
  createdResp,
  featureUnauthorized,
  gatewayTimeoutResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  serviceUnavailableResp,
  tooManyRequestsResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import {
  dockerEngine,
  dockerEngineId,
  dockerEngineIds,
  dockerEngineHostKeyUnknown,
  dockerEngineInfo,
  dockerEngineInfoAuthFailed,
  dockerEngineTestFailure,
  dockerEngineTestResult,
  partialDockerEngines,
} from '../open-api/oa-examples/docker-engine.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { assertDockerFeature, obfuscateDockerEngineParams, withDockerErrors } from '../helpers/docker.helper.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

// v1: no `acl` middleware, so every route is admin-only (see the README's
// ACLs section): the stored credentials give root-equivalent access to the
// Docker hosts. The `// ACLs v2:` comments give the middleware to add with the
// `docker-engine` ACL resource.
@Route('docker-engines')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Response(featureUnauthorized.status, featureUnauthorized.description)
@Tags('docker-engines')
@provide(DockerEngineController)
export class DockerEngineController extends XoController<XoDockerEngine> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('docker-engine', restApi)
  }

  // --- abstract methods
  getAllCollectionObjects(): Promise<XoDockerEngine[]> {
    return this.restApi.xoApp.getAllDockerEngines()
  }
  getCollectionObject(id: XoDockerEngine['id']): Promise<XoDockerEngine> {
    return this.restApi.xoApp.getDockerEngine(id)
  }

  /**
   * Configured Docker engines, without their secrets.
   *
   * Never connects: `connectionStatus` and `error` report the state of the
   * pooled SSH connection. Filter on `$VM` to find the engine of a VM (an empty
   * list means it has none).
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: read)
   *
   * @example fields "id,$VM,label,connectionStatus"
   * @example filter "$VM:c7b3b4bc-0000-4000-8000-00000000cafe"
   * @example limit 42
   */
  // ACLs v2: @Security('*', ['acl']) + sendObjects(…, { privilege: { action: 'read', resource: 'docker-engine' } })
  @Example(dockerEngineIds)
  @Example(partialDockerEngines)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getDockerEngines(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoDockerEngine>>>> {
    await assertDockerFeature(this.restApi)
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, { limit })
  }

  /**
   * Live information about the engine: connects (through the connection pool).
   *
   * Always answers 200 when the engine exists: `status` is `connected`, or
   * `unreachable`, `auth-failed` or `host-key-mismatch` with an `error`.
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: read)
   *
   * @example id "8d834412-eb40-4328-a815-3fcc0989bd07"
   */
  // ACLs v2: acl({ resource: 'docker-engine', action: 'read', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerEngine })
  @Example(dockerEngineInfo)
  @Example(dockerEngineInfoAuthFailed)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/info')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badGatewayResp.status, 'Docker API error of the daemon')
  @Response(serviceUnavailableResp.status, 'Too many busy SSH connections, see the Retry-After header')
  async getDockerEngineInfo(@Path() id: string): Promise<XoDockerEngineInfo> {
    await assertDockerFeature(this.restApi)
    // not cached: three requests on the pooled connection, and an unreachable
    // engine fails fast thanks to the pool's negative cache
    return this.restApi.xoApp.getDockerEngineInfo(id as XoDockerEngine['id'])
  }

  /**
   * The engine, without its secrets (`hasPassword` and `hasPrivateKey` tell
   * which ones are set). Never connects.
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: read)
   *
   * @example id "8d834412-eb40-4328-a815-3fcc0989bd07"
   */
  // ACLs v2: acl({ resource: 'docker-engine', action: 'read', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerEngine })
  @Example(dockerEngine)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getDockerEngine(@Path() id: string): Promise<Unbrand<XoDockerEngine>> {
    await assertDockerFeature(this.restApi)
    return this.getObject(id as XoDockerEngine['id'])
  }

  /**
   * Register a Docker engine reached through SSH.
   *
   * Connects first and saves nothing on failure.
   *
   * Host key: send the `hostKeyFingerprint` of the Docker host (`ssh-keygen -lf
   * /etc/ssh/ssh_host_ed25519_key.pub` on it). Without it, answers 409 with the
   * observed host key in `data` (`code: HOST_KEY_UNKNOWN`, `fingerprint`,
   * `algorithm`) and saves nothing: once the user has checked it, send the
   * same body again with `hostKeyFingerprint` set to that `fingerprint`. It is
   * verified on connection, so a key which changed in between is refused (409
   * `HOST_KEY_MISMATCH`).
   *
   * `acceptUnknownHostKey: true` (without `hostKeyFingerprint`) trusts and
   * pins whatever key is presented: only for automation which cannot check it.
   *
   * After an SSH authentication failure, a refused host key or an aborted
   * handshake, the same parameters are refused for `docker.authFailureCooldown`
   * (default 10 s): 429 `SSH_COOLDOWN` with `Retry-After`, without connecting.
   * Changed parameters are tried right away. `SSH_REFUSED_PENALTY` (502) means
   * that the SSH server closed the connection before the handshake soon after
   * failures: it may be temporarily refusing XO's address (OpenSSH
   * PerSourcePenalties).
   *
   * The credentials are stored in the XO database, encrypted only if
   * `redis.encryptCredentialDatabase` is enabled. Access to the Docker socket
   * is equivalent to root on the Docker host.
   *
   * Always synchronous: the result (or the error) is the response.
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: create)
   *
   * @example body {
   *   "$VM": "c7b3b4bc-0000-4000-8000-00000000cafe",
   *   "label": "Web server",
   *   "host": "192.168.1.42",
   *   "username": "xo",
   *   "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n…\n-----END OPENSSH PRIVATE KEY-----\n",
   *   "hostKeyFingerprint": "SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA"
   * }
   */
  // ACLs v2: acl({ resource: 'docker-engine', action: 'create', object: ({ req }) => req.body })
  @Example(dockerEngineId)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, 'The VM does not exist')
  @Response<{ error: string; data: Record<string, unknown> }>(
    409,
    'Unknown or mismatching SSH host key (see data.fingerprint), or the VM already has an engine',
    dockerEngineHostKeyUnknown
  )
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(tooManyRequestsResp.status, 'SSH_COOLDOWN: the same parameters failed recently, see Retry-After')
  @Response(badGatewayResp.status, 'SSH or Docker socket failure (see data.code, data.diagnostic)')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  async createDockerEngine(@Body() body: CreateDockerEngineBody): Promise<{ id: string }> {
    await assertDockerFeature(this.restApi)
    return this.createAction<{ id: string }>(
      async task => {
        const engine = await withDockerErrors(() =>
          this.restApi.xoApp.createDockerEngine(body as XoDockerEngineProperties)
        )
        task.set('objectId', engine.id)
        return { id: engine.id }
      },
      {
        sync: true,
        statusCode: createdResp.status,
        taskProperties: {
          name: 'create Docker engine',
          // set by the action, once created
          objectId: undefined as unknown as XoDockerEngine['id'],
          params: obfuscateDockerEngineParams(body),
        },
      }
    ) as Promise<{ id: string }>
  }

  /**
   * Partial update: omitted properties are kept, `null` or `''` clears them
   * (clearing `privateKey` also clears `passphrase`).
   *
   * Changing how to connect (host, port, username, password, privateKey,
   * passphrase, socketPath, hostKeyFingerprint, or the VM when the address
   * is resolved from it) connects first, verifying the host key with the new
   * or the stored pin, and saves nothing on failure, with the errors of the
   * creation: 409 `HOST_KEY_MISMATCH` (e.g. a wrong new `hostKeyFingerprint`),
   * 502 `SSH_AUTH_FAILED` (e.g. a wrong new key), 502
   * `DOCKER_SOCKET_UNREACHABLE` with `data.diagnostic`, 429 `SSH_COOLDOWN`…
   * On success, the pooled connection is closed. Clearing
   * `hostKeyFingerprint` (`null`) checks the host key like on creation: 409
   * `HOST_KEY_UNKNOWN` with the observed `fingerprint`, to send back as
   * `hostKeyFingerprint` (or `acceptUnknownHostKey: true`).
   *
   * Other changes (e.g. `label`) do not connect.
   *
   * Always synchronous.
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: update)
   *
   * @example id "8d834412-eb40-4328-a815-3fcc0989bd07"
   * @example body { "label": "Web server (prod)" }
   */
  // ACLs v2: acl({ resource: 'docker-engine', action: 'update', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerEngine })
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(409, 'Unknown or mismatching SSH host key (see data.fingerprint), or the VM already has an engine')
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(tooManyRequestsResp.status, 'SSH_COOLDOWN: the same parameters failed recently, see Retry-After')
  @Response(badGatewayResp.status, 'SSH or Docker socket failure (see data.code, data.diagnostic)')
  @Response(gatewayTimeoutResp.status, gatewayTimeoutResp.description)
  async updateDockerEngine(@Path() id: string, @Body() body: UpdateDockerEngineBody): Promise<void> {
    await assertDockerFeature(this.restApi)
    const engineId = id as XoDockerEngine['id']
    await this.createAction<void>(
      async () => {
        await withDockerErrors(() => this.restApi.xoApp.updateDockerEngine(engineId, body as XoDockerEngineProperties))
      },
      {
        sync: true,
        statusCode: noContentResp.status,
        taskProperties: {
          name: 'update Docker engine',
          objectId: engineId,
          params: obfuscateDockerEngineParams(body),
        },
      }
    )
  }

  /**
   * Remove the engine from XO (nothing is changed on the Docker host), and
   * close its connection.
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: delete)
   *
   * @example id "8d834412-eb40-4328-a815-3fcc0989bd07"
   */
  // ACLs v2: acl({ resource: 'docker-engine', action: 'delete', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerEngine })
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteDockerEngine(@Path() id: string): Promise<void> {
    await assertDockerFeature(this.restApi)
    const engineId = id as XoDockerEngine['id']
    await this.createAction<void>(() => withDockerErrors(() => this.restApi.xoApp.deleteDockerEngine(engineId)), {
      sync: true,
      statusCode: noContentResp.status,
      taskProperties: { name: 'delete Docker engine', objectId: engineId },
    })
  }

  /**
   * Check the connection with a new, non pooled, SSH connection.
   *
   * The result is never an error for connection problems: see `ok`, `error`,
   * and `diagnostic` which tells apart the causes of a Docker socket which
   * cannot be opened (missing socket, permission, forwarding disabled).
   *
   * Shortly after an authentication, host key or handshake failure of the
   * engine, it is refused without connecting: 429 `SSH_COOLDOWN` with
   * `Retry-After` (synchronous call).
   *
   * Required privilege:
   * - admin (v2: resource: docker-engine, action: test)
   *
   * @example id "8d834412-eb40-4328-a815-3fcc0989bd07"
   */
  // ACLs v2: acl({ resource: 'docker-engine', action: 'test', objectId: 'params.id', getObject: ({ restApi }) => restApi.xoApp.getDockerEngine })
  @Example(taskLocation)
  @Example(dockerEngineTestResult)
  @Example(dockerEngineTestFailure)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/test')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(200, 'Result of the test (synchronous call)')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(tooManyRequestsResp.status, 'SSH_COOLDOWN: a recent attempt failed, see Retry-After (synchronous call)')
  async testDockerEngine(
    @Path() id: string,
    @Query() sync?: boolean
  ): CreateActionReturnType<XoDockerEngineTestResult> {
    await assertDockerFeature(this.restApi)
    const engineId = id as XoDockerEngine['id']
    // 404 before creating a task
    await this.getObject(engineId)
    return this.createAction<XoDockerEngineTestResult>(
      () => withDockerErrors(() => this.restApi.xoApp.testDockerEngine(engineId)),
      {
        sync,
        statusCode: 200,
        // no body, so no params: the credentials are read from the database
        taskProperties: { name: 'test Docker engine', objectId: engineId },
      }
    )
  }
}
