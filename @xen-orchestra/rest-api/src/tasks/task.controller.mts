import type { Request as ExRequest } from 'express'
import type { XoTask } from '@vates/types'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import {
  Get,
  Path,
  Query,
  Request,
  Route,
  Security,
  Tags,
  Response,
  Example,
  Delete,
  Post,
  SuccessResponse,
  Middlewares,
} from 'tsoa'
import { acl } from '../middlewares/acl.middleware.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { partialTasks, task, taskIds, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import pDefer from 'promise-toolbox/defer'
import { ApiError } from '../helpers/error.helper.mjs'
import { Transform } from 'node:stream'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'
import { hasPrivilegeOn } from '@xen-orchestra/acl'

@Route('tasks')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('tasks')
@provide(TaskController)
export class TaskController extends XoController<XoTask> {
  async getAllCollectionObjects(): Promise<XoTask[]> {
    const result: XoTask[] = []
    for await (const task of this.restApi.tasks.list()) {
      result.push(task)
    }
    return result
  }

  getCollectionObject(id: XoTask['id']): Promise<XoTask> {
    return this.restApi.tasks.get(id)
  }

  /**
   * Returns all tasks that match the following privilege:
   * - resource: task, action: read
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
  @Security('*', ['acl'])
  @Response(badRequestResp.status, badRequestResp.description)
  async getTasks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() watch?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    if (watch) {
      if (!ndjson) {
        throw new ApiError('watch=true requires ndjson=true', 400)
      }

      const userFilter = filter === undefined ? undefined : safeParseComplexMatcher(filter).createPredicate()
      const stream = new Transform({
        objectMode: true,
        transform([event, object], encoding, callback) {
          const mapper = makeObjectMapper(req)
          callback(null, JSON.stringify([event, mapper(object)]) + '\n')
        },
      })

      stream.on('close', () => {
        this.restApi.tasks.off('update', update).off('remove', remove)
      })
      req.on('close', () => {
        stream.destroy()
      })
      process.on('SIGTERM', () => {
        req.destroy()
      })

      const userId = this.restApi.getCurrentUser().id
      const update = async (task: XoTask) => {
        const user = await this.restApi.xoApp.getUser(userId)
        const userPrivileges = await this.restApi.xoApp.getAclV2UserPrivileges(user.id)

        if (
          hasPrivilegeOn({ user, userPrivileges, action: 'read', resource: 'task', objects: task }) &&
          (userFilter === undefined || userFilter(task))
        ) {
          stream.write(['update', task])
        }
      }
      const remove = async (task: XoTask) => {
        const user = await this.restApi.xoApp.getUser(userId)
        const userPrivileges = await this.restApi.xoApp.getAclV2UserPrivileges(user.id)

        if (
          hasPrivilegeOn({ user, userPrivileges, action: 'read', resource: 'task', objects: task }) &&
          (userFilter === undefined || userFilter(task))
        ) {
          stream.write(['remove', { id: task.id }])
        }
      }

      this.restApi.tasks.on('update', update).on('remove', remove)

      return stream
    }

    const tasks = Object.values(await this.getObjects({ filter }))
    return this.sendObjects(tasks, req, {
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: task, action: read
   *
   * @example id "0mdd1basu"
   */
  @Example(task)
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'task',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.tasks.get.bind(restApi.xoApp.tasks),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
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

  /**
   * Deletes all tasks the current user has the following privilege on:
   * - resource: task, action: delete
   */
  @Delete('')
  @Security('*', ['acl'])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  async deleteTasks(): Promise<void> {
    const user = this.restApi.getCurrentUser()
    const userPrivileges = await this.restApi.xoApp.getAclV2UserPrivileges(user.id)

    const deletePromises: Promise<void>[] = []
    for await (const task of this.restApi.tasks.list()) {
      if (hasPrivilegeOn({ user, userPrivileges, resource: 'task', action: 'delete', objects: task })) {
        deletePromises.push(this.restApi.tasks.deleteLog(task.id))
      }
    }

    await Promise.all(deletePromises)
  }

  /**
   * Required privilege:
   * - resource: task, action: delete
   *
   * @example id "0mdd1basu"
   */
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'task',
      action: 'delete',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.tasks.get.bind(restApi.xoApp.tasks),
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteTask(@Path() id: string): Promise<void> {
    const task = await this.getObject(id as XoTask['id'])
    await this.restApi.tasks.deleteLog(task.id)
  }

  /**
   * Required privilege:
   * - resource: task, action: abort
   *
   * @example id "0mdd1basu"
   */
  @Example(taskLocation)
  @Post('{id}/actions/abort')
  @Middlewares(
    acl({
      resource: 'task',
      action: 'abort',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.tasks.get.bind(restApi.xoApp.tasks),
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async abortTask(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const taskId = id as XoTask['id']

    const action = async () => {
      await this.restApi.tasks.abort(taskId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'abort task',
        objectId: taskId,
      },
    })
  }
}
