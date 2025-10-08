import * as CM from 'complex-matcher'
import { Controller, HttpStatusCodeLiteral } from 'tsoa'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { Readable, type Transform } from 'node:stream'
import { Request } from 'express'
import type { VatesTask } from '@vates/types/lib/vates/task'
import type { XapiXoRecord, XoRecord, XoTask } from '@vates/types/xo'
import type { Xapi } from '@vates/types/lib/xen-orchestra/xapi'

import { BASE_URL } from '../index.mjs'
import { makeNdJsonStream } from '../helpers/stream.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { MaybePromise, SendObjects, WithHref } from '../helpers/helper.type.mjs'
import type { Response as ExResponse } from 'express'
import { NDJSON_CONTENT_TYPE } from '../helpers/utils.helper.mjs'

const noop = () => {}

export abstract class BaseController<T extends XoRecord, IsSync extends boolean> extends Controller {
  abstract getObjects(): IsSync extends false ? Promise<Record<T['id'], T>> : Record<T['id'], T>
  abstract getObject(id: T['id']): IsSync extends false ? Promise<T> : T

  restApi: RestApi

  constructor(restApi: RestApi) {
    super()
    this.restApi = restApi
  }

  sendObjects<Objects extends XoRecord = T>(
    objects: Objects[],
    req: Request,
    path?: string | ((obj: Objects) => string)
  ): SendObjects<Objects> {
    const mapper = makeObjectMapper(req, path)
    const mappedObjects = objects.map(mapper) as string[] | WithHref<Objects>[]

    if (req.query.ndjson === 'true') {
      const res = req.res as ExResponse
      res.setHeader('Content-Type', NDJSON_CONTENT_TYPE)

      const stream = Readable.from(makeNdJsonStream(mappedObjects))
      stream.pipe(res)

      return stream
    } else {
      return mappedObjects
    }
  }

  async getTasksForObject(
    id: T['id'],
    { filter, limit = Infinity }: { filter?: string; limit?: number } = {}
  ): Promise<Record<XoTask['id'], XoTask>> {
    const tasks: Record<XoTask['id'], XoTask> = {}
    const object = await Promise.resolve(this.getObject(id))

    const objectFilter = (task: XoTask) =>
      task.properties.objectId === object.id || task.properties.params?.id === object.id

    let userFilter: (task: XoTask) => boolean = () => true
    if (filter !== undefined) {
      userFilter = typeof filter === 'string' ? CM.parse(filter).createPredicate() : filter
    }

    for await (const task of this.restApi.tasks.list({ filter: objectFilter })) {
      if (limit === 0) {
        break
      }
      if (userFilter(task)) {
        tasks[task.id] = task
        limit--
      }
    }

    return tasks
  }

  /**
   * statusCode must represent the status code in case of a synchronous request. Default 200
   */
  async createAction<CbType>(
    cb: (task: VatesTask) => MaybePromise<CbType>,
    {
      statusCode = 200,
      sync = false,
      taskProperties,
    }: {
      statusCode?: HttpStatusCodeLiteral
      sync?: boolean
      taskProperties: { name: string; objectId: T['id']; params?: unknown; [key: string]: unknown }
    }
  ): Promise<string | CbType> {
    taskProperties.name = 'REST API: ' + taskProperties.name
    taskProperties.type = 'xo:rest-api:action'

    const task = this.restApi.tasks.create(taskProperties)
    const pResult = task.run(() => cb(task))

    if (sync) {
      this.setStatus(statusCode)
      return pResult
    } else {
      pResult.catch(noop)
      const location = `${BASE_URL}/tasks/${task.id}`
      this.setStatus(202)
      this.setHeader('Location', location)
      this.setHeader('Content-Type', 'text/plain')

      return location
    }
  }

  getXapi(maybeId: XapiXoRecord | XapiXoRecord['id']): Xapi {
    return this.restApi.xoApp.getXapi(maybeId)
  }

  maybeCompressResponse(req: Request, res: ExResponse): Transform | ExResponse {
    let transform: Transform | undefined

    const _acceptEncoding = req.headers['accept-encoding']
    const acceptEncoding: string[] | undefined = Array.isArray(_acceptEncoding)
      ? _acceptEncoding
      : _acceptEncoding?.split(',')
    if (
      acceptEncoding !== undefined &&
      acceptEncoding.some(encoding => {
        const value = encoding.split(';')[0].trim().toLowerCase()
        // support `x-gzip` as an alias for `gzip`
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding#gzip
        return value === 'gzip' || value === 'x-gzip'
      })
    ) {
      res.setHeader('Content-Encoding', 'gzip')
      transform = createGzip()
    }

    if (transform !== undefined) {
      pipeline(transform, res).catch(noop)
      return transform
    }

    return res
  }
}
