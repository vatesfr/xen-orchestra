import { json, type Request as ExRequest } from 'express'
import type { XoTask } from '@vates/types'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
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
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { partialTasks, task, taskIds, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import pDefer from 'promise-toolbox/defer'
import { ApiError } from '../helpers/error.helper.mjs'
import { Transform } from 'node:stream'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { AnyPrivilege, hasPrivilegeOn } from '@xen-orchestra/acl'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:rest-api:task-controller')

@Route('tasks')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('tasks')
@provide(TaskController)
export class TaskController extends XoController<XoTask> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('task', restApi)
  }

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
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  @Response(badRequestResp.status, badRequestResp.description)
  async getTasks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() watch?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    if (watch) {
      if (!ndjson) {
        throw new ApiError('watch=true requires ndjson=true', 400)
      }

      const userFilter = filter === undefined ? undefined : safeParseComplexMatcher(filter).createPredicate()
      const mapper = makeObjectMapper(req)
      const stream = new Transform({
        objectMode: true,
        // in object mode this is a number of queued events, see `safeWrite()`
        highWaterMark: this.restApi.xoApp.config.get<number>('rest-api.maxEventsQueuedPerWatchClient'),
        transform([event, object], encoding, callback) {
          callback(null, JSON.stringify([event, mapper(object)]) + '\n')
        },
      })

      // The producer is an event emitter shared by the whole application, it
      // cannot be slowed down: a client which stops consuming this stream — a
      // dropped connection, a sleeping laptop — would otherwise have its events
      // queued forever, and each of them retains a whole task log.
      //
      // Destroy such a client instead, like SSE subscribers are: it reconnects
      // and refetches the whole collection, so no state is lost.
      const safeWrite = (event: ['update', XoTask] | ['remove', { id: XoTask['id'] }]) => {
        if (!stream.write(event)) {
          warn('too many events queued for this client, the connection is going to be destroyed', {
            queued: stream.writableLength,
          })
          req.destroy()
        }
      }

      const onSigTerm = () => {
        req.destroy()
      }

      stream.on('close', () => {
        this.restApi.tasks.off('update', update).off('remove', remove)
        // this listener would otherwise retain `req` — and through it this
        // stream and everything it has buffered — for the whole process life
        process.off('SIGTERM', onSigTerm)
      })
      req.on('close', () => {
        stream.destroy()
      })
      process.on('SIGTERM', onSigTerm)

      const userId = this.restApi.getCurrentUser().id
      const update = async (task: XoTask) => {
        const user = await this.restApi.xoApp.getUser(userId)
        const userPrivileges =
          user.permission === 'admin'
            ? []
            : ((await this.restApi.xoApp.getAclV2UserPrivileges(user.id)) as AnyPrivilege[])

        if (
          hasPrivilegeOn({ user, userPrivileges, action: 'read', resource: 'task', objects: task }) &&
          (userFilter === undefined || userFilter(task))
        ) {
          safeWrite(['update', task])
        }
      }
      const remove = async (task: XoTask) => {
        const user = await this.restApi.xoApp.getUser(userId)
        const userPrivileges =
          user.permission === 'admin'
            ? []
            : ((await this.restApi.xoApp.getAclV2UserPrivileges(user.id)) as AnyPrivilege[])

        if (
          hasPrivilegeOn({ user, userPrivileges, action: 'read', resource: 'task', objects: task }) &&
          (userFilter === undefined || userFilter(task))
        ) {
          safeWrite(['remove', { id: task.id }])
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
  @Extension('x-mcp-exposure', 'allow')
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
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('')
  @Security('*', ['acl'])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  async deleteTasks(): Promise<void> {
    const user = this.restApi.getCurrentUser()
    const userPrivileges =
      user.permission === 'admin' ? [] : ((await this.restApi.xoApp.getAclV2UserPrivileges(user.id)) as AnyPrivilege[])

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
  @Extension('x-mcp-exposure', 'confirm')
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
   * Asks the task to stop. A backup job then runs its cleanup (removal of the snapshots, clean of the backup
   * directory and merge of the backups) before it ends.
   *
   * With `skipCleanup`, the cleanup is stopped too, so the job ends as soon as possible: the steps that have started
   * complete, the next ones are not run, and a merge of VHD files stops between two blocks and is resumed by the next
   * run. A merge of VHD directories already running completes, as the backup it merges cannot be read before. The VM
   * is restarted and unblocked, and the remote unlocked, in all cases. Snapshots, merges and files may be left, the
   * next run of the job cleans them. It can be sent after a first abort of the task.
   *
   * @example id "0mdd1basu"
   * @example body { "skipCleanup": true }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/abort')
  @Middlewares([
    json(),
    acl({
      resource: 'task',
      action: 'abort',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.tasks.get.bind(restApi.xoApp.tasks),
    }),
  ])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async abortTask(
    @Path() id: string,
    @Body()
    body?: {
      /** Also stop the cleanup of the task. Defaults to false. */
      skipCleanup?: boolean
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const taskId = id as XoTask['id']

    const action = async () => {
      await this.restApi.tasks.abort(taskId, undefined, { skipCleanup: body?.skipCleanup })
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'abort task',
        objectId: taskId,
        params: body,
      },
    })
  }
}
