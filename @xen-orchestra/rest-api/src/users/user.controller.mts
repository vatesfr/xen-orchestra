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
import { partialUsers, updateUserRequestBody, user, userIds } from '../open-api/oa-examples/user.oa-example.mjs'
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
   */
  @Example(updateUserRequestBody)
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  async updateUser(@Path() id: string, @Body() body: UpdateUserRequestBody): Promise<void> {
    const { name, password, permission, preferences } = body
    await this.restApi.xoApp.updateUser(id as XoUser['id'], { name, password, permission, preferences })
  }
}
