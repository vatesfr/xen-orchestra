import type { AnyPrivilege } from '@xen-orchestra/acl'
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

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  aclPrivilege,
  aclPrivilegeIds,
  partialAclPrivileges,
} from '../open-api/oa-examples/acl-privilege.oa-example.mjs'
import {
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { SafeOmit, SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { entityId } from '../open-api/oa-examples/common.oa-example.mjs'

@Route('acl-privileges')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('acls')
@provide(AclPrivilegeController)
export class AclPrivilegeController extends XoController<AnyPrivilege> {
  getAllCollectionObjects(): Promise<AnyPrivilege[]> {
    return this.restApi.xoApp.getAclV2Privileges() as Promise<AnyPrivilege[]>
  }
  getCollectionObject(id: AnyPrivilege['id']): Promise<AnyPrivilege> {
    return this.restApi.xoApp.getAclV2Privilege(id) as Promise<AnyPrivilege>
  }

  /**
   * Returns all ACL privileges that match the following privilege:
   * - resource: acl-privilege, action: read
   *
   * @example fields "id,action,resource"
   * @example filter "action:create"
   * @example limit 42
   */
  @Example(aclPrivilegeIds)
  @Example(partialAclPrivileges)
  @Get('')
  @Security('*', ['acl'])
  async getAclV2Privileges(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<AnyPrivilege>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'acl-privilege' },
    })
  }

  /**
   * Required privilege:
   * - resource: acl-privilege, action: create
   *
   * @example privilege {
   *  "action": "read",
   *  "resource": "alarm",
   *  "roleId": "784bd959-08de-4b26-b575-92ded5aef872",
   *  "effect": "allow",
   *  "selector": "id:784bd959-08de-4b26-b575-92ded5aef872"
   * }
   */
  @Example(entityId)
  @Post('')
  @Middlewares([json(), acl({ resource: 'acl-privilege', action: 'create', object: ({ req }) => req.body })])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createAclV2Privilege(
    @Body() privilege: Unbrand<SafeOmit<AnyPrivilege, 'id'>>
  ): Promise<{ id: Unbrand<AnyPrivilege>['id'] }> {
    const newPrivilege = await this.restApi.xoApp.createAclV2Privilege(privilege as SafeOmit<AnyPrivilege, 'id'>)

    return { id: newPrivilege.id }
  }

  /**
   * Required privilege:
   * - resource: acl-privilege, action: read
   *
   * @example id "c5d89d1a-df1e-4b72-98a0-c40adfdf49c1"
   */
  @Example(aclPrivilege)
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'acl-privilege',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Privilege,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getAclV2Privilege(@Path() id: string): Promise<Unbrand<AnyPrivilege>> {
    return this.getObject(id as AnyPrivilege['id'])
  }

  /**
   * Required privilege:
   * - resource: acl-privilege, action: delete
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   */
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'acl-privilege',
      action: 'delete',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Privilege,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteAclV2Privilege(@Path() id: string): Promise<void> {
    await this.restApi.xoApp.deleteAclV2Privilege(id as AnyPrivilege['id'])
  }

  /**
   * Required privilege:
   * - resource: acl-privilege, action: update
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example privilege {
   *  "action": "read",
   *  "resource": "alarm",
   *  "effect": "allow",
   *  "selector": "id:784bd959-08de-4b26-b575-92ded5aef872"
   * }
   */
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'acl-privilege',
      action: 'update',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Privilege,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async updateAclV2Privilege(
    @Path() id: string,
    @Body() privilege: Unbrand<SafeOmit<AnyPrivilege, 'id' | 'roleId'>>
  ): Promise<void> {
    await this.restApi.xoApp.updateAclV2Privilege(id as AnyPrivilege['id'], privilege)
  }
}
