import { Example, Get, Path, Query, Request, Response, Route, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoTask } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialTasks, task, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('tasks')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('tasks')
@provide(TaskController)
export class TaskController extends XoController<XoTask> {
  async getAllCollectionObjects(opts?: { filter?: string; limit?: number }): Promise<XoTask[]> {
    const tasks: XoTask[] = []
    for await (const task of this.restApi.xoApp.tasks.list({ ...(opts ?? {}) })) {
      tasks.push(task)
    }
    return tasks
  }
  getCollectionObject(id: XoTask['id']): Promise<XoTask> {
    return this.restApi.xoApp.tasks.get(id)
  }

  /**
   * @example fields "status,id"
   * @example filter "status:/^failure/"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('')
  async getTasks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<string[] | WithHref<Partial<Unbrand<XoTask>>>[]> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "0m791h1sr"
   */
  @Get('{id}')
  @Example(task)
  @Response(notFoundResp.status, notFoundResp.description)
  async getTask(@Path() id: string): Promise<Unbrand<XoTask>> {
    return this.getObject(id as XoTask['id'])
  }
}
