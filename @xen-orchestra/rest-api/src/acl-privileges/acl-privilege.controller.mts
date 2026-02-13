import { Delete, Example, Get, Patch, Path, Post, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import {
  aclPrivilege,
  aclPrivilegeIds,
  partialAclPrivileges,
} from '../open-api/oa-examples/acl-privilege.oa-example.mjs'
import { badRequestResp, notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import type { RestAnyPrivilege } from './acl-privilege.type.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('acl-privileges')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('acls')
@provide(AclPrivilegeController)
export class AclPrivilegeController extends XoController<RestAnyPrivilege> {
  getAllCollectionObjects(): Promise<RestAnyPrivilege[]> {
    return this.restApi.xoApp.getAclV2Privileges() as Promise<RestAnyPrivilege[]>
  }
  getCollectionObject(id: RestAnyPrivilege['id']): Promise<RestAnyPrivilege> {
    return this.restApi.xoApp.getAclV2Privilege(id) as Promise<RestAnyPrivilege>
  }

  /**
   * @example fields "id,action,resource"
   * @example filter "action:create"
   * @example limit 42
   */
  @Example(aclPrivilegeIds)
  @Example(partialAclPrivileges)
  @Get('')
  async getAclV2Privileges(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<RestAnyPrivilege>>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example action "read"
   * @example resource "alarm"
   * @example roleId "784bd959-08de-4b26-b575-92ded5aef872"
   * @example effect "allow"
   * @example selector "selector"
   */
  @Example(aclPrivilege)
  @Post('')
  async createAclV2Privilege(
    @Query() action: string,
    @Query() resource: string,
    @Query() roleId: string,
    @Query() effect?: string,
    @Query() selector?: string,
    @Query() force?: boolean
  ): Promise<Unbrand<RestAnyPrivilege>> {
    let options = {}
    if (force !== undefined) {
      options = { force }
    }

    return this.restApi.xoApp.createAclV2Privilege(
      {
        action: action as RestAnyPrivilege['action'],
        selector: selector as RestAnyPrivilege['selector'],
        effect: effect as RestAnyPrivilege['effect'],
        resource: resource as RestAnyPrivilege['resource'],
        roleId: roleId as RestAnyPrivilege['roleId'],
      },
      options
    )
  }

  /**
   * @example id "c5d89d1a-df1e-4b72-98a0-c40adfdf49c1"
   */
  @Example(aclPrivilege)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getAclV2Privilege(@Path() id: string): Promise<Unbrand<RestAnyPrivilege>> {
    return this.getObject(id as RestAnyPrivilege['id'])
  }

  /**
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   */
  @Delete(':id')
  async deleteAclV2Privilege(@Path() id: string, @Query() force?: boolean): Promise<void> {
    let options = {}
    if (force !== undefined) {
      options = { force }
    }

    await this.restApi.xoApp.deleteAclV2Privilege(id as RestAnyPrivilege['id'], options)
  }

  /**
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example action "read"
   * @example resource "alarm"
   * @example effect "allow"
   * @example selector "selector"
   */
  @Example(aclPrivilege)
  @Patch(':id')
  async updateAclV2Privilege(
    @Path() id: string,
    @Query() action?: string,
    @Query() resource?: string,
    @Query() effect?: string,
    @Query() selector?: string,
    @Query() force?: boolean
  ): Promise<Unbrand<RestAnyPrivilege>> {
    let options = {}
    if (force !== undefined) {
      options = { force }
    }

    return this.restApi.xoApp.updateAclV2Privilege(
      id as RestAnyPrivilege['id'],
      {
        action: action as RestAnyPrivilege['action'],
        selector: selector as RestAnyPrivilege['selector'],
        effect: effect as RestAnyPrivilege['effect'],
        resource: resource as RestAnyPrivilege['resource'],
      },
      options
    )
  }
}
