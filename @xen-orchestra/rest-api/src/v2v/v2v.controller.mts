import {
  Body,
  Controller,
  Example,
  Extension,
  Get,
  Middlewares,
  Post,
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
  badRequestResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { v2vInventory, v2vStatus } from '../open-api/oa-examples/v2v.oa-example.mjs'
import { V2vService } from './v2v.service.mjs'
import type { V2vInventory, V2vInventoryBody, V2vStatus } from './v2v.type.mjs'

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
  #v2vService: V2vService

  constructor(@inject(V2vService) v2vService: V2vService) {
    super()
    this.#v2vService = v2vService
  }

  /**
   * Whether this XO can migrate VMs: the tools of an import must run on its system, whatever the source.
   *
   * Checked before connecting to a source, which needs no credentials.
   */
  @Example(v2vStatus)
  @Get('status')
  @SuccessResponse(200, 'OK')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  getV2vStatus(): Promise<V2vStatus> {
    return this.#v2vService.getStatus()
  }

  /**
   * Reads the whole inventory of the source: datacenters, clusters, hosts, datastores, networks and VMs
   * with their disks and network cards, with the product, version and instance UUID of the source.
   *
   * Also validates the credentials: 422 with the `V2V_INVALID_CREDENTIALS` code when they are refused by the source.
   *
   * A read, not an action: it is a `POST` only because the credentials have to stay out of the URL.
   *
   * @example body { "platform": "vmware", "connection": { "host": "vcenter.example.org", "username": "administrator@vsphere.local", "password": "secret", "skipSslCheck": true } }
   */
  @Example(v2vInventory)
  // the body carries the credentials of the source
  @Extension('x-mcp-exposure', 'deny')
  @Post('inventory')
  @Middlewares(json())
  @SuccessResponse(200, 'OK')
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  getInventory(@Body() body: V2vInventoryBody): Promise<V2vInventory> {
    return this.#v2vService.getInventory(body.connection)
  }
}
