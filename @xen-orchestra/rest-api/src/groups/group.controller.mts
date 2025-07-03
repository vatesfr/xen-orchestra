import { Body, Example, Get, Patch, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoGroup, XoUser } from '@vates/types'

import { forbiddenOperation } from 'xo-common/api-errors.js'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { group, groupIds, partialGroups } from '../open-api/oa-examples/group.oa-example.mjs'
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
   * @example id "6c81b5e1-afc1-43ea-8f8d-939ceb5f3f90"
   */
  @Patch('{id}')
  async updateGroup(@Path() id: string, @Body() body: Omit<XoGroup, 'id'>): Promise<void> {
    const { name, provider, providerGroupId, users } = body
    const group = await this.restApi.xoApp.getGroup(id as XoGroup['id'])

    if (group.provider !== undefined) {
      throw forbiddenOperation('Cannot edit synchronized group.')
    }

    await this.restApi.xoApp.updateGroup(id as XoGroup['id'], { name, provider, providerGroupId, users })
  }
}
