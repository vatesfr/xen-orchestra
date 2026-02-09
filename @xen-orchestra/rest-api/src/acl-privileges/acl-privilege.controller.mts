import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import {
  aclPrivilege,
  aclPrivilegeIds,
  partialAclPrivileges,
} from '../open-api/oa-examples/acl-privilege.oa-example.mjs'
import { badRequestResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
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
   * @example id "c5d89d1a-df1e-4b72-98a0-c40adfdf49c1"
   */
  @Example(aclPrivilege)
  @Get('{id}')
  getAclV2Privilege(@Path() id: string): Promise<Unbrand<RestAnyPrivilege>> {
    return this.getObject(id as RestAnyPrivilege['id'])
  }
}
