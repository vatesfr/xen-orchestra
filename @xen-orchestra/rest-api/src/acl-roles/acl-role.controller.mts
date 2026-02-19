import {
  Body,
  Delete,
  Example,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import { type Request as ExRequest, json } from 'express'
import type { XoAclRole, XoGroup, XoGroupRole, XoUser, XoUserRole } from '@vates/types'

import {
  aclGroupRole,
  aclRole,
  aclRoleIds,
  aclUserRole,
  partialAclRoles,
} from '../open-api/oa-examples/acl-role.oa-example.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  noContentResp,
  notFoundResp,
  resourceAlreadyExists,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../index.mjs'
import { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('acl-roles')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('acls')
@provide(AclRoleController)
export class AclRoleController extends XoController<XoAclRole> {
  getAllCollectionObjects(): Promise<XoAclRole[]> {
    return this.restApi.xoApp.getAclV2Roles()
  }
  getCollectionObject(id: XoAclRole['id']): Promise<XoAclRole> {
    return this.restApi.xoApp.getAclV2Role(id)
  }

  /**
   * @example fields "id,name,isTemplate"
   * @example filter "name:read only"
   * @example limit 42
   */
  @Example(aclRoleIds)
  @Example(partialAclRoles)
  @Get('')
  async getAclV2Roles(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoAclRole>>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   */
  @Example(aclRole)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getAclV2Role(@Path() id: string): Promise<Unbrand<XoAclRole>> {
    return this.getObject(id as XoAclRole['id'])
  }

  /**
   * Copy a role with all its privileges. Possibility to modify the name and description of the copied role.
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example body {"name": "Copied role"}
   */
  @Example(taskLocation)
  @Post('{id}/actions/copy')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  copyAclV2Role(
    @Path() id: string,
    @Body() body?: { name?: string; description?: string },
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: string }> {
    const roleId = id as XoAclRole['id']

    const action = async () => {
      const id = await this.restApi.xoApp.copyAclV2Role(roleId, body)

      if (sync) {
        this.setHeader('Location', `${BASE_URL}/acl-roles/${id}`)
      }
      return { id }
    }

    return this.createAction<{ id: XoAclRole['id'] }>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        args: body,
        name: 'copy role',
        objectId: roleId,
      },
    })
  }

  /**
   * Attach a role to a group.
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example groupId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Example(aclGroupRole)
  @Put('{id}/group/{groupId}')
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  async attachAclV2Group(@Path() id: string, @Path() groupId: string): Promise<XoGroupRole> {
    const roleId = id as XoAclRole['id']

    // addAclV2GroupRole does not check if the group exists so we get the group here to make sure it exists.
    const group = await this.restApi.xoApp.getGroup(groupId as XoGroup['id'])

    return this.restApi.xoApp.addAclV2GroupRole(group.id, roleId)
  }

  /**
   * Detach a role from a group.
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example groupId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Delete('{id}/group/{groupId}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async detachAclV2Group(@Path() id: string, @Path() groupId: string): Promise<void> {
    const roleId = id as XoAclRole['id']

    // deleteAclV2GroupRole does not check if the group exists so we get the group here to make sure it exists.
    const group = await this.restApi.xoApp.getGroup(groupId as XoGroup['id'])

    await this.restApi.xoApp.deleteAclV2GroupRole(group.id, roleId)
  }

  /**
   * Attach a role to a user.
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example userId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Example(aclUserRole)
  @Put('{id}/user/{userId}')
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  async attachAclV2User(@Path() id: string, @Path() userId: string): Promise<XoUserRole> {
    const roleId = id as XoAclRole['id']

    // addAclV2UserRole does not check if the user exists so we get the user here to make sure it exists.
    const user = await this.restApi.xoApp.getUser(userId as XoUser['id'])

    return this.restApi.xoApp.addAclV2UserRole(user.id, roleId)
  }

  /**
   * Detach a role from a user.
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example userId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Delete('{id}/user/{userId}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async detachAclV2User(@Path() id: string, @Path() userId: string): Promise<void> {
    const roleId = id as XoAclRole['id']

    // deleteAclV2UserRole does not check if the user exists so we get the user here to make sure it exists.
    const user = await this.restApi.xoApp.getUser(userId as XoUser['id'])

    await this.restApi.xoApp.deleteAclV2UserRole(user.id, roleId)
  }
}
