import {
  Body,
  Delete,
  Example,
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
import { provide } from 'inversify-binding-decorators'
import { json, type Request as ExRequest } from 'express'

import {
  aclPrivilege,
  aclPrivilegeIds,
  partialAclPrivileges,
} from '../open-api/oa-examples/acl-privilege.oa-example.mjs'
import {
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
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
   * Returns all ACL privileges that match the following privilege:
   * resource: acl-privilege, action: read
   *
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
  ): SendObjects<Partial<Unbrand<RestAnyPrivilege>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'acl-privilege' },
    })
  }

  /**
   * @example privilege {
   *  "action": "read",
   *  "resource": "alarm",
   *  "roleId": "784bd959-08de-4b26-b575-92ded5aef872",
   *  "effect": "allow",
   *  "selector": {"id": "784bd959-08de-4b26-b575-92ded5aef872"}
   * }
   */
  @Example(aclPrivilege)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async createAclV2Privilege(
    @Body() privilege: Omit<RestAnyPrivilege, 'id'>
  ): Promise<Unbrand<RestAnyPrivilege['id']>> {
    const newPrivilege = await this.restApi.xoApp.createAclV2Privilege(privilege)

    return newPrivilege.id
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
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteAclV2Privilege(@Path() id: string): Promise<void> {
    await this.restApi.xoApp.deleteAclV2Privilege(id as RestAnyPrivilege['id'])
  }

  /**
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example privilege {
   *  "action": "read",
   *  "resource": "alarm",
   *  "effect": "allow",
   *  "selector": {"id": "784bd959-08de-4b26-b575-92ded5aef872"}
   * }
   */
  @Example(aclPrivilege)
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async updateAclV2Privilege(
    @Path() id: string,
    @Body() privilege: Omit<RestAnyPrivilege, 'id' | 'roleId'>
  ): Promise<void> {
    await this.restApi.xoApp.updateAclV2Privilege(id as RestAnyPrivilege['id'], privilege)
  }
}
