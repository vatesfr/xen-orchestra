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
import { json, type Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoAuthenticationToken, XoUser } from '@vates/types'

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
import { partialUsers, user, userId, userIds } from '../open-api/oa-examples/user.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'
import type { UpdateUserRequestBody } from './user.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('users')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('users')
@provide(UserController)
export class UserController extends XoController<XoUser> {
  // --- abstract methods
  async getAllCollectionObjects(): Promise<XoUser[]> {
    const users = await this.restApi.xoApp.getAllUsers()
    return users.map(user => this.#sanitizeUser(user))
  }

  async getCollectionObject(id: XoUser['id']): Promise<XoUser> {
    const user = await this.restApi.xoApp.getUser(id)
    return this.#sanitizeUser(user)
  }

  #sanitizeUser(user: XoUser): XoUser {
    const sanitizedUser = { ...user }

    if (sanitizedUser.pw_hash !== undefined) {
      sanitizedUser.pw_hash = '***obfuscated***'
    }

    return sanitizedUser
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
   * @example filter "expiration:>1757371582496"
   * @example limit 42
   */
  @Get('{id}/authentication_tokens')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async getAuthenticationTokens(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Unbrand<XoAuthenticationToken>>> {
    const user = await this.getObject(id as XoUser['id'])
    const me = this.restApi.getCurrentUser()

    if (me.id !== user.id) {
      throw forbiddenOperation('get authentication tokens', 'can only see own authentication tokens')
    }

    const tokens = await this.restApi.xoApp.getAuthenticationTokensForUser(user.id)

    return this.sendObjects(limitAndFilterArray(tokens, { filter, limit }), req)
  }
}
