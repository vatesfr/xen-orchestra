import {
  Body,
  Example,
  Get,
  Middlewares,
  Patch,
  Path,
  Put,
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
import type { XoUser } from '@vates/types'
import {
  featureUnauthorized,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { forbiddenOperation } from 'xo-common/api-errors.js'
import { partialUsers, user, userIds } from '../open-api/oa-examples/user.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
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
   *   "email": "user@email.com",
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
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  async updateUser(@Path() id: string, @Body() body: UpdateUserRequestBody): Promise<void> {
    const { email, name, password, permission, preferences } = body
    const isAdmin = this.restApi.xoApp.apiContext.permission === 'admin'
    const currentUserId = this.restApi.xoApp.apiContext.user?.id

    if (isAdmin) {
      if (permission != null && id === currentUserId) {
        throw forbiddenOperation("A user cannot change it's own permission.")
      }
    } else if (name != null || password != null || permission != null) {
      throw forbiddenOperation('These properties can only be changed by an administrator.')
    }

    const user = await this.restApi.xoApp.getUser(id as XoUser['id'])

    if (user.authProviders && Object.keys(user.authProviders).length > 0 && (name != null || password != null)) {
      throw forbiddenOperation('Cannot change the name or password of synchronized user')
    }

    await this.restApi.xoApp.updateUser(id as XoUser['id'], { email, name, password, permission, preferences })
  }
}
