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
  getAllCollectionObjects(): Promise<XoUser[]> {
    return this.restApi.xoApp.getAllUsers()
  }
  getCollectionObject(id: XoUser['id']): Promise<XoUser> {
    return this.restApi.xoApp.getUser(id)
  }

  partialUser(user: XoUser): Partial<Unbrand<XoUser>> {
    return {
      ...user,
      pw_hash: '***obfuscated***',
    }
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
  ): Promise<string[] | WithHref<Partial<Unbrand<XoUser>>>[]> {
    const users = Object.values(await this.getObjects({ filter, limit })).map(this.partialUser)
    return this.sendObjects(users as XoUser[], req)
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Example(user)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getUser(@Path() id: string): Promise<Partial<Unbrand<XoUser>>> {
    const user = await this.getObject(id as XoUser['id'])
    return this.partialUser(user)
  }
}
