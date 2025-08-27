import * as CM from 'complex-matcher'
import type { Request as ExRequest } from 'express'
import type { XoTask } from '@vates/types'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { Get, Path, Query, Request, Route, Security, Tags, Response, Example, Delete, SuccessResponse } from 'tsoa'
import { SendObjects } from '../helpers/helper.type.mjs'
import {
  badRequestResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { partialTasks, task, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'
import pDefer from 'promise-toolbox/defer'
import { ApiError } from '../helpers/error.helper.mjs'
import { Readable } from 'node:stream'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'

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
   *
   * If watch is true, ndjson must also be true
   *
   * @example fields "status,id,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('')
  @Response(badRequestResp.status, badRequestResp.description)
  async getTasks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() watch?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    if (watch) {
      if (!ndjson) {
        throw new ApiError('watch=true requires ndjson=true', 400)
      }

      const userFilter = filter === undefined ? undefined : CM.parse(filter).createPredicate()
      const stream = new Readable({ read() {} })
      stream.on('close', () => {
        this.restApi.tasks.off('update', update).off('remove', remove)
      })
      req.on('close', () => {
        stream.destroy()
      })
      process.on('SIGTERM', () => {
        req.destroy()
      })

      function update(task: XoTask) {
        if (userFilter === undefined || userFilter(task)) {
          const mapper = makeObjectMapper(req)
          stream.push(JSON.stringify(['update', mapper(task)]) + '\n')
        }
      }
      function remove(taskId: XoTask['id']) {
        stream.push(JSON.stringify(['remove', taskId]) + '\n')
      }

      this.restApi.tasks.on('update', update).on('remove', remove)

      return stream
    }

    const tasks = Object.values(await this.getObjects({ filter, limit }))
    return this.sendObjects(tasks, req)
  }

  /**
   * @example id "0mdd1basu"
   */
  @Example(task)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getTask(@Request() req: ExRequest, @Path() id: string, @Query() wait?: boolean): Promise<Unbrand<XoTask>> {
    const taskId = id as XoTask['id']
    if (wait) {
      const { promise, resolve } = pDefer()
      const stopWatch = await this.restApi.tasks.watch(taskId, task => {
        if (task.status !== 'pending') {
          stopWatch()
          resolve(task)
        }
      })
      req.on('close', stopWatch)
      return promise as Promise<XoTask>
    }

    return this.getObject(taskId)
  }

  @Delete('')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  async deleteTasks() {
    await this.restApi.tasks.clearLogs()
  }

  /**
   * @example id "0mdd1basu"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteTask(@Path() id: string) {
    const task = await this.getObject(id as XoTask['id'])
    await this.restApi.tasks.deleteLog(task.id)
  }
}
