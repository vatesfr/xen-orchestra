import { Body, Example, Get, Patch, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoGroup, XoUser } from '@vates/types'

import { forbiddenOperation, operationBlocked } from 'xo-common/api-errors.js'
import {
  notFoundResp,
  resourceAlreadyExists,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { group, groupIds, partialGroups } from '../open-api/oa-examples/group.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

interface updateGroupRequest {
  name: string
}
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
   * @example id "c98395a7-26d8-4e09-b055-d5f0f4a98312"
   */
  @Patch('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  async updateGroup(@Path() id: string, @Body() body: updateGroupRequest): Promise<void> {
    const { name } = body
    const group = await this.restApi.xoApp.getGroup(id as XoGroup['id'])

    if (group.provider !== undefined) {
      throw forbiddenOperation('Cannot edit synchronized group.')
    }

    if ('name' in body && body.name?.trim() === '') {
      throw operationBlocked('Group name cannot be empty')
    }

    await this.restApi.xoApp.updateGroup(id as XoGroup['id'], { name })
  }
}
