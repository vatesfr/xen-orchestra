import type { XoTask } from '@vates/types'
import { Example, Get, Path, Query, Request, Response, Route } from 'tsoa'
import { notFoundResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import type { Request as ExRequest } from 'express'
import type { WithHref } from '../helpers/helper.type.mjs'
import { provide } from 'inversify-binding-decorators'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { inject } from 'inversify'
import { partialTasks, task, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('tasks')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@provide(TaskController)
export class TaskController extends XapiXoController<XoTask> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('task', restApi)
  }

  /**
   * @example fields "name_label,uuid"
   * @example filter "status:/^pending/"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('')
  getTasks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoTask>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "74086fd8-3065-b647-a10a-6889b1f7ca05"
   */
  @Get('{id}')
  @Example(task)
  @Response(notFoundResp.status, notFoundResp.description)
  getPool(@Path() id: string): Unbrand<XoTask> {
    return this.getObject(id as XoTask['id'])
  }
}
