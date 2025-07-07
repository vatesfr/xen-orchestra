import { Controller, HttpStatusCodeLiteral } from 'tsoa'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { Readable, type Transform } from 'node:stream'
import { Request } from 'express'
import type { Task } from '@vates/types/lib/vates/task'
import type { XapiXoRecord, XoRecord } from '@vates/types/xo'
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

  sendObjects(objects: T[], req: Request): SendObjects<T> {
    const mapper = makeObjectMapper(req)
    const mappedObjects = objects.map(mapper) as string[] | WithHref<T>[]

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

  /**
   * statusCode must represent the status code in case of a synchronous request. Default 200
   */
  async createAction<CbType>(
    cb: (task: Task) => MaybePromise<CbType>,
    {
      statusCode = 200,
      sync = false,
      taskProperties,
    }: {
      statusCode?: HttpStatusCodeLiteral
      sync?: boolean
      taskProperties: { name: string; objectId: T['id']; args?: unknown; [key: string]: unknown }
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

    let acceptEncoding = req.headers['accept-encoding']
    acceptEncoding = Array.isArray(acceptEncoding) ? acceptEncoding : acceptEncoding?.split(',')
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
