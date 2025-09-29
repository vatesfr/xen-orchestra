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
import { inject } from 'inversify'
import { json, type Request as ExRequest, type Response as ExResponse } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoAuthenticationToken, XoGroup, XoUser } from '@vates/types'

import {
  createdResp,
  forbiddenOperationResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  resourceAlreadyExists,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { forbiddenOperation } from 'xo-common/api-errors.js'
import { partialUsers, user, authenticationTokens, userId, userIds } from '../open-api/oa-examples/user.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'
import type { UpdateUserRequestBody } from './user.type.mjs'
import { UserService } from './user.service.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { groupIds, partialGroups } from '../open-api/oa-examples/group.oa-example.mjs'

@Route('users')
@Security('*')
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

  #redirectCurrentUser(req: ExRequest): void {
    const currentUser = this.restApi.getCurrentUser()
    const originalUrl = req.originalUrl
    const res = req.res as ExResponse

    res.redirect(307, originalUrl.replace(/\/users\/me(?=\/|$)/, `/users/${currentUser.id}`))
  }

  /**
   * @example fields "permission,name,id"
   * @example filter "permission:none"
   * @example limit 42
   */
  @Example(userIds)
  @Example(partialUsers)
  @Get('')
  async getUsers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoUser>>>> {
    const users = Object.values(await this.getObjects({ filter, limit }))
    return this.sendObjects(users, req)
  }

  /**
   * Redirect to `/users/:id`
   */
  @SuccessResponse(307, 'Temporary redirect')
  @Get('me')
  redirectMe(@Request() req: ExRequest) {
    this.#redirectCurrentUser(req)
  }

  /**
   * Redirect to `/users/:id/<rest-of-your-path>`
   */
  @SuccessResponse(307, 'Temporary redirect')
  @Get('me/*')
  redirectMeWithPath(@Request() req: ExRequest) {
    this.#redirectCurrentUser(req)
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Example(user)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getUser(@Path() id: string): Promise<Unbrand<XoUser>> {
    return this.getObject(id as XoUser['id'])
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example body {
   *   "name": "updated user name",
   *   "password": "newP4ssword",
   *   "permission": "admin",
   *   "preferences": {}
   *  }
   */
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async updateUser(@Path() id: string, @Body() body: UpdateUserRequestBody): Promise<void> {
    const currentUser = this.restApi.getCurrentUser()

    const isAdmin = currentUser.permission === 'admin'

    if (isAdmin) {
      if (body.permission !== undefined && currentUser.id === id) {
        throw forbiddenOperation('update user', 'cannot change own permission')
      }
    } else if (body.name !== undefined || body.password !== undefined || body.permission !== undefined) {
      throw forbiddenOperation('update user', 'cannot change these fields without admin rights')
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
   * @example body { "name": "new user", "password": "password", "permission": "none" }
   */
  @Example(userId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(unauthorizedResp.status, unauthorizedResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createUser(
    @Body() body: { name: string; password: string; permission?: string }
  ): Promise<{ id: Unbrand<XoUser>['id'] }> {
    const user = await this.restApi.xoApp.createUser(body)

    return { id: user.id }
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteUser(@Path() id: string): Promise<void> {
    await this.restApi.xoApp.deleteUser(id as XoUser['id'])
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example fields "name,id,users"
   * @example filter "users:length:>0"
   * @example limit 42
   */
  @Example(groupIds)
  @Example(partialGroups)
  @Get('{id}/groups')
  @Tags('groups')
  @Response(notFoundResp.status, notFoundResp.description)
  async getUserGroups(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoGroup>>>> {
    const user = await this.getObject(id as XoUser['id'])
    const groups = await Promise.all(user.groups.map(group => this.restApi.xoApp.getGroup(group)))

    return this.sendObjects(limitAndFilterArray(groups, { filter, limit }), req, 'groups')
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example filter "expiration:>1757371582496"
   * @example limit 42
   */
  @Example(authenticationTokens)
  @Get('{id}/authentication_tokens')
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
}
