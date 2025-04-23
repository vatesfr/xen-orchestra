import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import type { XoUser } from '@vates/types'
import { partialUsers, user, userIds } from '../open-api/oa-examples/user.oa-example.mjs'

@Route('users')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('users')
@provide(UserController)
export class UserController extends XoController<XoUser> {
  // --- abstract methods
  async getAllCollectionObjects(): Promise<XoUser[]> {
    const users = this.restApi.xoApp.getAllUsers()
    return (await users).map(user => this.sanitizeUser(user))
  }

  async getCollectionObject(id: XoUser['id']): Promise<XoUser> {
    const user = await this.restApi.xoApp.getUser(id)
    return this.sanitizeUser(user)
  }

  private sanitizeUser(user: XoUser): XoUser {
    const sanitizedUser = { ...user }

    if (sanitizedUser.pw_hash !== undefined) {
      sanitizedUser.pw_hash = '***obfuscated***'
    }

    return sanitizedUser
  }

  /**
   * @example fields "permission,name,id"
   * @example filter "permission:admin"
   * @example limit 42
   */
  @Example(userIds)
  @Example(partialUsers)
  @Get('')
  async getUsers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<string[] | WithHref<XoUser>[] | WithHref<Partial<XoUser>>[]> {
    const users = Object.values(await this.getObjects({ filter, limit }))
    return this.sendObjects(users, req)
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Example(user)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getUser(@Path() id: string): Promise<Unbrand<XoUser>> {
    const user = await this.getObject(id as XoUser['id'])
    return this.sanitizeUser(user)
  }
}
