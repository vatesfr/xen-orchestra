import { Body, Delete, Example, Get, Middlewares, Path, Post, Query, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { json, type Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoGroup } from '@vates/types'

import { createdResp, invalidParameters, noContentResp, notFoundResp, resourceAlreadyExists, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
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
   * "name": "new group",
   * "provider": "64a7a0b4-e728-47e2-a082-93a218890a81",
   * "providerGroupId": "722d17b9-699b-49d2-8193-be1ac573d3de"
   * }
   */
  @Example(groupId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createGroup(
    @Body() body: { name: string; provider?: string; providerGroupId?: string }
  ): Promise<{ id: Unbrand<XoGroup['id']> }> {
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
}
