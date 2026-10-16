import {
  Body,
  Controller,
  Example,
  Extension,
  Middlewares,
  Post,
  Query,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { json } from 'express'
import { provide } from 'inversify-binding-decorators'

import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../helpers/utils.helper.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { v2vInventory, v2vStartResult } from '../open-api/oa-examples/v2v.oa-example.mjs'
import { V2vService, V2V_TASK_NAME } from './v2v.service.mjs'
import type { V2vInventory, V2vInventoryBody, V2vStartBody, V2vStartResult } from './v2v.type.mjs'

const noop = () => {}

/**
 * Migration of VMs from another virtualization platform (VMware only for now).
 *
 * Nothing is stored server side: every request carries the connection to the source.
 * No ACL privilege covers these routes: they are restricted to administrators.
 */
@Route('v2v')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
@Tags('v2v')
@provide(V2vController)
export class V2vController extends Controller {
  #restApi: RestApi
  #v2vService: V2vService

  constructor(@inject(RestApi) restApi: RestApi, @inject(V2vService) v2vService: V2vService) {
    super()
    this.#restApi = restApi
    this.#v2vService = v2vService
  }

  /**
   * Reads the whole inventory of the source: datacenters, clusters, hosts, datastores, networks and VMs
   * with their disks and network cards, with the product, version and instance UUID of the source.
   *
   * Also validates the credentials: 400 when they are refused by the source.
   *
   * @example body { "platform": "vmware", "connection": { "host": "vcenter.example.org", "username": "administrator@vsphere.local", "password": "secret", "skipSslCheck": true } }
   */
  @Example(v2vInventory)
  // the body carries the credentials of the source
  @Extension('x-mcp-exposure', 'deny')
  @Post('actions/inventory')
  @Middlewares(json())
  @SuccessResponse(200, 'OK')
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  getInventory(@Body() body: V2vInventoryBody): Promise<V2vInventory> {
    return this.#v2vService.getInventory(body.connection)
  }

  /**
   * Imports a list of VMs into one pool. A VM already partially imported on this pool is resumed with a
   * delta, otherwise it is imported entirely. With `stopSource`, the source VM is stopped before the last
   * delta, which completes the import.
   *
   * For now, all the disks of a VM go to one SR, all its network cards to one network, the MAC addresses
   * are kept, and `tags`, `startVm` and `cleanup` are refused.
   *
   * The request is checked before the import starts: 422 with the list of the problems.
   *
   * As in XO5, the XCP-ng side is not checked: that the SRs, networks and templates belong to `pool`,
   * that no import of the same VM is already running, and that the VM has not already been imported.
   * Launching a VM twice at the same time leads to two imports competing for the same partial import:
   * wait for the end of a task before launching its VMs again. A VM already fully imported is imported
   * again, as a second VM.
   *
   * The task result is the UUID of the XCP-ng VM, by VMware VM id.
   *
   * @example body { "platform": "vmware", "connection": { "host": "vcenter.example.org", "username": "administrator@vsphere.local", "password": "secret" }, "pool": "b7569d99-30f8-178a-7d94-801de3e29b5b", "defaults": { "sr": "c4284e12-37c9-7967-b9e8-83ef229c3e03", "network": "6b6ca0f5-6611-0636-4b0a-1fb1c815e898", "template": "0f3b3b5d-ef02-4fb5-9b7a-d4a2e5eb8e14", "stopSource": true }, "vms": [{ "id": "vm-1042" }], "concurrency": 2 }
   */
  @Example(taskLocation)
  @Example(v2vStartResult)
  @Extension('x-mcp-exposure', 'deny')
  @Post('actions/start')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(200, 'OK')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async start(@Body() body: V2vStartBody, @Query() sync?: boolean): CreateActionReturnType<V2vStartResult> {
    const plans = await this.#v2vService.prepareStart(body)

    // the credentials stay out of the task, which every administrator can read
    const task = this.#restApi.tasks.create({
      name: `REST API: ${V2V_TASK_NAME}`,
      type: 'xo:rest-api:action',
      params: {
        platform: body.platform,
        host: body.connection.host,
        pool: body.pool,
        vms: plans.map(plan => plan.id),
      },
    })
    const pResult = task.run(() => this.#v2vService.start(task, body, plans))

    if (sync) {
      return pResult
    }
    pResult.catch(noop)
    this.setStatus(202)
    this.setHeader('Location', `${BASE_URL}/tasks/${task.id}`)
    return { taskId: task.id }
  }
}
