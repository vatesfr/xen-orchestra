import {
  Body,
  Delete,
  Example,
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
import { inject } from 'inversify'
import { json, type Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoGroup, XoUser } from '@vates/types'

import { forbiddenOperation } from 'xo-common/api-errors.js'
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
import { group, groupId, groupIds, partialGroups } from '../open-api/oa-examples/group.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import type { UpdateGroupRequestBody } from './group.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { UserService } from '../users/user.service.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'
import { partialUsers, userIds } from '../open-api/oa-examples/user.oa-example.mjs'

@Route('groups')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('groups')
@provide(GroupController)
export class GroupController extends XoController<XoGroup> {
  #userService: UserService

  constructor(@inject(RestApi) restApi: RestApi, @inject(UserService) userService: UserService) {
    super(restApi)
    this.#userService = userService
  }

  // --- abstract methods
  getAllCollectionObjects(): Promise<XoGroup[]> {
    return this.restApi.xoApp.getAllGroups()
  }
  getCollectionObject(id: XoGroup['id']): Promise<XoGroup> {
    return this.restApi.xoApp.getGroup(id)
  }

  /**
   * @example fields "name,id,users"
   * @example filter "users:length:>0"
   * @example limit 42
   */
  @Example(groupIds)
  @Example(partialGroups)
  @Get('')
  async getGroups(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoGroup>>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "7d98fee4-3357-41a7-ac3f-9124212badb7"
   */
  @Example(group)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getGroup(@Path() id: string): Promise<Unbrand<XoGroup>> {
    return this.getObject(id as XoGroup['id'])
  }

  /**
   * @example id "c98395a7-26d8-4e09-b055-d5f0f4a98312"
   * @example body { "name": "new group name" }
   */
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async updateGroup(@Path() id: string, @Body() body: UpdateGroupRequestBody): Promise<void> {
    const group = await this.getObject(id as XoGroup['id'])

    if (group.provider !== undefined) {
      throw forbiddenOperation('update group', 'synchronized group')
    }

    await this.restApi.xoApp.updateGroup(group.id, body)
  }

  /**
   *  @example body {
   *    "name": "new group"
   *  }
   */
  @Example(groupId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  async createGroup(@Body() body: { name: string }): Promise<{ id: Unbrand<XoGroup>['id'] }> {
    const group = await this.restApi.xoApp.createGroup(body)

    return { id: group.id }
  }

  /**
   * @example id "7d98fee4-3357-41a7-ac3f-9124212badb7"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteGroup(@Path() id: string): Promise<void> {
    const groupId = id as XoGroup['id']
    await this.restApi.xoApp.deleteGroup(groupId)
  }

  /**
   * @example id "c98395a7-26d8-4e09-b055-d5f0f4a98312"
   * @example userId "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Delete('{id}/users/{userId}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async removeUserFromGroup(@Path() id: string, @Path() userId: string): Promise<void> {
    const group = await this.getObject(id as XoGroup['id'])

    if (group.provider !== undefined) {
      throw forbiddenOperation('remove user from group', 'synchronized group')
    }

    await this.restApi.xoApp.removeUserFromGroup(userId as XoUser['id'], group.id)
  }

  /**
   * @example id "6c81b5e1-afc1-43ea-8f8d-939ceb5f3f90"
   * @example userId "722d17b9-699b-49d2-8193-be1ac573d3de"
   */
  @Put('{id}/users/{userId}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  async addUserToGroup(@Path() id: string, @Path() userId: string): Promise<void> {
    const group = await this.getObject(id as XoGroup['id'])
    if (group.provider !== undefined) {
      throw forbiddenOperation('add user to group', 'synchronized group')
    }

    await this.restApi.xoApp.addUserToGroup(userId as XoUser['id'], group.id)
  }

  /**
   * @example id "6c81b5e1-afc1-43ea-8f8d-939ceb5f3f90"
   * @example fields "permission,name,id"
   * @example filter "permission:none"
   * @example limit 42
   */
  @Example(userIds)
  @Example(partialUsers)
  @Get('{id}/users')
  @Tags('users')
  async getGroupUsers(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoUser>>>> {
    const group = await this.getObject(id as XoGroup['id'])
    const users = await Promise.all(group.users.map(id => this.#userService.getUser(id)))
    return this.sendObjects(limitAndFilterArray(users, { filter, limit }), req, 'users')
  }
}
