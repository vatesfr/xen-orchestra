import { Body, Delete, Example, Get, Middlewares, Path, Post, Put, Query, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
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
import { forbiddenOperation } from 'xo-common/api-errors.js'
import { group, groupId, groupIds, partialGroups } from '../open-api/oa-examples/group.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('groups')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('groups')
@provide(GroupController)
export class GroupController extends XoController<XoGroup> {
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
   * @example body {
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
  @Response(forbiddenOperation.status, forbiddenOperation.description)
  async removeUserFromGroup(@Path() id: string, @Path() userId: string): Promise<void> {
  const group = await this.getObject(id as XoGroup['id'])

    if (group.provider !== undefined) {
      throw forbiddenOperation('Cannot remove user from synchronized group')
    }

    await this.restApi.xoApp.removeUserFromGroup(userId as XoUser['id'], id as XoGroup['id'])
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
}
