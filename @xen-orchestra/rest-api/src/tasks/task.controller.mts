import type { Request as ExRequest } from 'express'
import type { XoTask } from '@vates/types'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { Get, Path, Query, Request, Route, Security, Tags, Response, Example } from 'tsoa'
import { SendObjects } from '../helpers/helper.type.mjs'
import { notFoundResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { partialTasks, task, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('tasks')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('tasks')
@provide(TaskController)
export class TaskController extends XoController<XoTask> {
  getAllCollectionObjects(): Promise<XoTask[]> {
    return Array.fromAsync(this.restApi.tasks.list())
  }

  getCollectionObject(id: XoTask['id']): Promise<XoTask> {
    return this.restApi.tasks.get(id)
  }

  /**
   * @example fields "status,id,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('')
  async getTasks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = Object.values(await this.getObjects({ filter, limit }))
    return this.sendObjects(tasks, req)
  }

  /**
   * @example id "0mdd1basu"
   */
  @Example(task)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getTask(@Path() id: string): Promise<Unbrand<XoTask>> {
    return this.getObject(id as XoTask['id'])
  }
}
