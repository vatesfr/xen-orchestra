import type { AnyPrivilege } from '@xen-orchestra/acl'
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
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { createLogger } from '@xen-orchestra/log'
import { provide } from 'inversify-binding-decorators'
import { type Request as ExRequest, json } from 'express'
import type { XoAclRole, XoGroup, XoUser } from '@vates/types'

import { acl, actionsFromBody } from '../middlewares/acl.middleware.mjs'
import { aclPrivilegeIds, partialAclPrivileges } from '../open-api/oa-examples/acl-privilege.oa-example.mjs'
import { aclRole, aclRoleIds, partialAclRoles } from '../open-api/oa-examples/acl-role.oa-example.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  resourceAlreadyExists,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../index.mjs'
import { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { entityId } from '../open-api/oa-examples/common.oa-example.mjs'
import { inject } from 'inversify'
import { RestApi } from '../rest-api/rest-api.mjs'
import { UserService } from '../users/user.service.mjs'
import { partialUsers, userIds } from '../open-api/oa-examples/user.oa-example.mjs'

const log = createLogger('xo:rest-api:acl-role-controller')

@Route('acl-roles')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('rbacs')
@provide(AclRoleController)
export class AclRoleController extends XoController<XoAclRole> {
  #userService: UserService

  constructor(@inject(RestApi) restApi: RestApi, @inject(UserService) userService: UserService) {
    super('acl-role', restApi)
    this.#userService = userService
  }

  getAllCollectionObjects(): Promise<XoAclRole[]> {
    return this.restApi.xoApp.getAclV2Roles()
  }
  getCollectionObject(id: XoAclRole['id']): Promise<XoAclRole> {
    return this.restApi.xoApp.getAclV2Role(id)
  }

  /**
   * Returns all ACL roles that match the following privilege:
   * - resource: acl-role, action: read
   *
   * @example fields "id,name,isTemplate"
   * @example filter "name:read only"
   * @example limit 42
   */
  @Example(aclRoleIds)
  @Example(partialAclRoles)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getAclV2Roles(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAclRole>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { resource: 'acl-role', action: 'read' },
    })
  }

  /**
   * Required privilege:
   * - resource: acl-role, action: create
   *
   * @example body {
   *  "name": "VMs creator",
   *  "description": "Allow to create VMs"
   * }
   */
  @Example(entityId)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares([
    json(),
    acl({
      resource: 'acl-role',
      action: 'create',
      object: ({ req }) => req.body,
    }),
  ])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createAclV2Role(
    @Body() body: { name: string; description?: string }
  ): Promise<{ id: Unbrand<XoAclRole>['id'] }> {
    const newRole = await this.restApi.xoApp.createAclV2Role(body)
    return { id: newRole.id }
  }

  /**
   * Required privilege:
   * - resource: acl-role, action: read
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   */
  @Example(aclRole)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'acl-role',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getAclV2Role(@Path() id: string): Promise<Unbrand<XoAclRole>> {
    return this.getObject(id as XoAclRole['id'])
  }

  /**
   * Required privilege:
   * - resource: acl-role, action: delete
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'acl-role',
      action: 'delete',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteAclV2Role(@Path() id: string): Promise<void> {
    await this.restApi.xoApp.deleteAclV2Role(id as XoAclRole['id'])
  }

  /**
   * Required privileges:
   * - resource: acl-role, action: update (grants all fields)
   * - resource: acl-role, action: update:name (if name is passed)
   * - resource: acl-role, action: update:description (if description is passed)
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example body {
   *  "name": "VMs creator",
   *  "description": "Allow to create VMs"
   * }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'acl-role',
      actions: actionsFromBody(['update:name', 'update:description']),
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async updateAclV2Role(
    @Path() id: string,
    @Body() body: { name?: string; description?: string | null }
  ): Promise<void> {
    await this.restApi.xoApp.updateAclV2Role(id as XoAclRole['id'], body)
  }

  /**
   * Copy a role with all its privileges. Possibility to modify the name and description of the copied role.
   *
   * Required privileges:
   * - resource: acl-role, action: create
   * - resource: acl-privilege, action: create (if copied role has privileges)
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example body {"name": "Copied role"}
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/copy')
  @Middlewares([
    json(),
    acl([
      {
        resource: 'acl-role',
        action: 'create',
        object: async ({ req, restApi }) => {
          const model = await restApi.xoApp.getAclV2Role(req.params.id as XoAclRole['id'])
          return { name: req.body.name ?? model.name, description: req.body.description ?? model.description }
        },
      },
      {
        resource: 'acl-privilege',
        action: 'create',
        objects: async ({ req, restApi }) => {
          const privileges = await restApi.xoApp.getAclV2RolePrivileges(req.params.id as XoAclRole['id'])
          return privileges.map(({ id, ...rest }) => rest)
        },
      },
    ]),
  ])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
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
   * Returns all ACL privileges that match the following privilege:
   * - resource: acl-privilege, action: read
   *
   * @example id "426622cc-b2db-4545-a2f0-6ec47b3a6450"
   * @example fields "id,action,resource"
   * @example filter "action:create"
   * @example limit 42
   */
  @Example(aclPrivilegeIds)
  @Example(partialAclPrivileges)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/privileges')
  @Security('*', ['acl'])
  @Response(notFoundResp.status, notFoundResp.description)
  async getAclV2RolePrivileges(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<AnyPrivilege>>> {
    const privileges = (await this.restApi.xoApp.getAclV2RolePrivileges(id as XoAclRole['id'])) as AnyPrivilege[]
    return this.sendObjects(limitAndFilterArray(privileges, { filter }), req, {
      path: 'acl-privileges',
      limit,
      privilege: { resource: 'acl-privilege', action: 'read' },
    })
  }

  /**
   * Attach an ACL V2 role to a group.
   *
   * Required privilege:
   * - resource: acl-role, action: update:groups
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example groupId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/groups/{groupId}')
  @Middlewares(
    acl({
      resource: 'acl-role',
      action: 'update:groups',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  async attachAclV2Group(@Path() id: string, @Path() groupId: string): Promise<void> {
    const roleId = id as XoAclRole['id']

    // addAclV2GroupRole does not check if the group exists so we get the group here to make sure it exists.
    const group = await this.restApi.xoApp.getGroup(groupId as XoGroup['id'])

    await this.restApi.xoApp.addAclV2GroupRole(group.id, roleId)
  }

  /**
   * Detach an ACL V2 role from a group.
   *
   * Required privilege:
   * - resource: acl-role, action: update:groups
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example groupId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/groups/{groupId}')
  @Middlewares(
    acl({
      resource: 'acl-role',
      action: 'update:groups',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async detachAclV2Group(@Path() id: string, @Path() groupId: string): Promise<void> {
    const roleId = id as XoAclRole['id']

    // deleteAclV2GroupRole does not check if the group exists so we get the group here to make sure it exists.
    const group = await this.restApi.xoApp.getGroup(groupId as XoGroup['id'])

    await this.restApi.xoApp.deleteAclV2GroupRole(group.id, roleId)
  }

  /**
   * Attach an ACL V2 role to a user.
   *
   * Required privilege:
   * - resource: acl-role, action: update:users
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example userId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/users/{userId}')
  @Middlewares(
    acl({
      resource: 'acl-role',
      action: 'update:users',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  async attachAclV2User(@Path() id: string, @Path() userId: string): Promise<void> {
    const roleId = id as XoAclRole['id']

    // addAclV2UserRole does not check if the user exists so we get the user here to make sure it exists.
    const user = await this.restApi.xoApp.getUser(userId as XoUser['id'])

    await this.restApi.xoApp.addAclV2UserRole(user.id, roleId)
  }

  /**
   * Detach an ACL V2 role from a user.
   *
   * Required privilege:
   * - resource: acl-role, action: update:users
   *
   * @example id "784bd959-08de-4b26-b575-92ded5aef872"
   * @example userId "ee4965bf-d8af-4ca2-aa0e-5f29d0c5f9e2"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/users/{userId}')
  @Middlewares(
    acl({
      resource: 'acl-role',
      action: 'update:users',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getAclV2Role,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async detachAclV2User(@Path() id: string, @Path() userId: string): Promise<void> {
    const roleId = id as XoAclRole['id']

    // deleteAclV2UserRole does not check if the user exists so we get the user here to make sure it exists.
    const user = await this.restApi.xoApp.getUser(userId as XoUser['id'])

    await this.restApi.xoApp.deleteAclV2UserRole(user.id, roleId)
  }

  /**
   * Returns all users that match the following privilege:
   * - resource: user, action: read
   *
   * @example id "426622cc-b2db-4545-a2f0-6ec47b3a6450"
   * @example fields "permission,name,id"
   * @example filter "permission:none"
   * @example limit 42
   */
  @Example(userIds)
  @Example(partialUsers)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/users')
  @Security('*', ['acl'])
  @Tags('users')
  @Response(notFoundResp.status, notFoundResp.description)
  async getAclRoleUsers(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoUser>>> {
    const role = await this.getObject(id as XoAclRole['id'])
    const users =
      'isTemplate' in role
        ? []
        : await Promise.all(
          role.userIds.map(userId =>
            this.#userService.getUser(userId).catch(err => {
              log.warn(`cannot resolve user: ${userId}`, err)
              // TODO: Fix removing a user do not correctly detach it from the acl role
              // if the user is not resolvable (E.g. not properly removed) do not hide it (as even if it doesn't exist, it is attached, so need to be cleaned)
              return { id: userId } as XoUser
            })
          )
        )

    return this.sendObjects(limitAndFilterArray(users, { filter }), req, {
      path: 'users',
      limit,
      privilege: { resource: 'user', action: 'read' },
    })
  }
}
