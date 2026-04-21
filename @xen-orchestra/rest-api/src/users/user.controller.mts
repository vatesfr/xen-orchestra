import {
  Body,
  Delete,
  Deprecated,
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
import { createLogger } from '@xen-orchestra/log'
import { forbiddenOperation } from 'xo-common/api-errors.js'
import { inject } from 'inversify'
import { json, type Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoAuthenticationToken, XoGroup, XoTask, XoUser } from '@vates/types'

import { acl, actionIfNotSelfUser, actionsFromBody } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  resourceAlreadyExists,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import {
  partialUsers,
  user,
  authenticationTokens,
  userId,
  userIds,
  authenticationToken,
} from '../open-api/oa-examples/user.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'
import type { UpdateUserRequestBody } from './user.type.mjs'
import { UserService } from './user.service.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { groupIds, partialGroups } from '../open-api/oa-examples/group.oa-example.mjs'
import { partialTasks, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'
import { redirectMeAlias } from './user.middleware.mjs'
import { aclPrivilegeIds, partialAclPrivileges } from '../open-api/oa-examples/acl-privilege.oa-example.mjs'
import type { AnyPrivilege } from '@xen-orchestra/acl'

const log = createLogger('xo:rest-api:user-controller')

@Route('users')
@Security('*')
@Middlewares(redirectMeAlias)
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('users')
@provide(UserController)
export class UserController extends XoController<XoUser> {
  #userService: UserService

  constructor(@inject(RestApi) restApi: RestApi, @inject(UserService) userService: UserService) {
    super(restApi)
    this.#userService = userService
  }

  // --- abstract methods
  async getAllCollectionObjects(): Promise<XoUser[]> {
    return this.#userService.getUsers()
  }

  async getCollectionObject(id: XoUser['id']): Promise<XoUser> {
    return this.#userService.getUser(id)
  }

  /**
   * Returns all users that match the following privilege:
   * - resource: user, action: read
   *
   * @example fields "permission,name,id"
   * @example filter "permission:none"
   * @example limit 42
   */
  @Example(userIds)
  @Example(partialUsers)
  @Get('')
  @Security('*', ['acl'])
  async getUsers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoUser>>> {
    const users = Object.values(await this.getObjects({ filter }))
    return this.sendObjects(users, req, {
      limit,
      privilege: { action: 'read', resource: 'user' },
    })
  }

  /**
   * Required privilege:
   * - resource: user, action: read (if not self)
   *
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Example(user)
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'user',
      action: actionIfNotSelfUser('read'),
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getUser,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getUser(@Path() id: string): Promise<Unbrand<XoUser>> {
    return this.getObject(id as XoUser['id'])
  }

  /**
   * You cannot change your own `permission` (even with the right privilege)
   *
   * Required privileges:
   * - resource: user, action: update (grants all fields)
   * - resource: user, action: update:name (if name is passed)
   * - resource: user, action: update:password (if password is passed)
   * - resource: user, action: update:permission (if permission is passed)
   * - resource: user, action: update:preferences (if preferences is passed)
   *
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example body {
   *   "name": "updated user name",
   *   "password": "newP4ssword",
   *   "permission": "admin",
   *   "preferences": {}
   *  }
   */
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'user',
      actions: actionsFromBody(['update:name', 'update:password', 'update:permission', 'update:preferences']),
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getUser,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async updateUser(@Path() id: string, @Body() body: UpdateUserRequestBody): Promise<void> {
    const currentUser = this.restApi.getCurrentUser()

    if (body.permission !== undefined && currentUser.id === id) {
      throw forbiddenOperation('update user', 'cannot change own permission')
    }

    const user = await this.getObject(id as XoUser['id'])

    if (
      user.authProviders !== undefined &&
      Object.keys(user.authProviders).length > 0 &&
      (body.name !== undefined || body.password !== undefined)
    ) {
      throw forbiddenOperation('update user', 'cannot change name or password of synchronized user')
    }

    await this.restApi.xoApp.updateUser(user.id, body)
  }

  /**
   * Required privilege:
   * - resource: user, action: create
   *
   * @example body { "name": "new user", "password": "password", "permission": "none" }
   */
  @Example(userId)
  @Post('')
  @Middlewares([json(), acl({ resource: 'user', action: 'create', object: ({ req }) => req.body })])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(unauthorizedResp.status, unauthorizedResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createUser(
    @Body() body: { name: string; password: string; permission?: string }
  ): Promise<{ id: Unbrand<XoUser>['id'] }> {
    const user = await this.restApi.xoApp.createUser(body)

    return { id: user.id }
  }

  /**
   * Required privilege:
   * - resource: user, action: delete
   *
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'user',
      action: 'delete',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getUser,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteUser(@Path() id: string): Promise<void> {
    await this.restApi.xoApp.deleteUser(id as XoUser['id'])
  }

  /**
   * Returns all groups that match the following privilege:
   * - resource: group, action: read
   *
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example fields "name,id,users"
   * @example filter "users:length:>0"
   * @example limit 42
   */
  @Example(groupIds)
  @Example(partialGroups)
  @Get('{id}/groups')
  @Security('*', ['acl'])
  @Tags('groups')
  @Response(notFoundResp.status, notFoundResp.description)
  async getUserGroups(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoGroup>>> {
    const user = await this.getObject(id as XoUser['id'])
    const groups = await Promise.all(user.groups.map(group => this.restApi.xoApp.getGroup(group)))

    return this.sendObjects(limitAndFilterArray(groups, { filter }), req, {
      path: 'groups',
      limit,
      privilege: { action: 'read', resource: 'group' },
    })
  }

  /**
   * You can only see your own authentication tokens
   *
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example filter "expiration:>1757371582496"
   * @example limit 42
   */
  @Example(authenticationTokens)
  @Get('{id}/authentication_tokens')
  @Security('*', ['acl'])
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async getAuthenticationTokens(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<Unbrand<XoAuthenticationToken>[]> {
    const user = await this.getObject(id as XoUser['id'])

    const me = this.restApi.getCurrentUser()
    if (me.id !== user.id) {
      throw forbiddenOperation('get authentication tokens', 'can only see own authentication tokens')
    }

    const tokens = await this.restApi.xoApp.getAuthenticationTokensForUser(user.id)

    return limitAndFilterArray(tokens, { filter, limit })
  }

  /**
   * Returns all tasks that match the following privilege:
   * - resource: task, action: read
   *
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Security('*', ['acl'])
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getUserTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoUser['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  // ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (10-13-2026)--------------------
  /**
   * @example body {"client": {"id": "my-fav-client"}, "description": "token for CLI usage", "expiresIn": "1 hour"}
   */
  @Example(authenticationToken)
  @Deprecated()
  @Post('authentication_tokens')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async postDeprecatedAuthenticationTokens(
    @Body()
    body: {
      client?: {
        id?: string
      }
      description?: string
      expiresIn?: string | number
    }
  ): Promise<{ token: Unbrand<XoAuthenticationToken> }> {
    log.warn(
      'You are calling a deprecated route. It will be removed in the futur. Please use `/rest/v0/users/:id/authentication_tokens` or `/rest/v0/users/me/authentication_tokens` instead'
    )
    const user = this.restApi.getCurrentUser()

    const token = await this.restApi.xoApp.createAuthenticationToken({
      ...body,
      userId: user.id,
    })

    return { token }
  }
  // ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (10-13-2026)--------------------

  /**
   * You can only create authentication token for yourself
   *
   * @example id "me"
   * @example body {"client": {"id": "my-fav-client"}, "description": "token for CLI usage", "expiresIn": "1 hour"}
   */
  @Example(authenticationToken)
  @Post('{id}/authentication_tokens')
  @Middlewares(json())
  @Security('*', ['acl'])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async postAuthenticationTokens(
    @Body()
    body: {
      client?: {
        id?: string
      }
      description?: string
      expiresIn?: string | number
    },
    @Path() id: string
  ): Promise<{ token: Unbrand<XoAuthenticationToken> }> {
    const user = this.restApi.getCurrentUser()
    if (user.id !== id) {
      throw forbiddenOperation('create authentication token', 'you can only create token for yourself')
    }

    const token = await this.restApi.xoApp.createAuthenticationToken({
      ...body,
      userId: user.id,
    })

    return { token }
  }

  /**
   * Returns all ACL privileges that match the following privilege:
   * - resource: acl-privilege, action: read (if not self)
   *
   * @example id "me"
   * @example fields "id,action,resource"
   * @example filter "action:create"
   * @example limit 42
   */
  @Example(aclPrivilegeIds)
  @Example(partialAclPrivileges)
  @Get('{id}/acl-privileges')
  @Security('*', ['acl'])
  @Tags('acls')
  @Response(notFoundResp.status, notFoundResp.description)
  async getUserPrivileges(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<AnyPrivilege>>> {
    const user = await this.getObject(id as XoUser['id'])
    const currentUser = this.restApi.getCurrentUser()

    const userPrivileges = await this.restApi.xoApp.getAclV2UserPrivileges(user.id)

    return this.sendObjects(limitAndFilterArray(userPrivileges, { filter }), req, {
      path: 'acl-privileges',
      limit,
      privilege: currentUser.id === user.id ? undefined : { action: 'read', resource: 'acl-privilege' },
    })
  }
}
