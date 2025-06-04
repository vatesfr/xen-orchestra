import { Controller, HttpStatusCodeLiteral } from 'tsoa'
import { Request } from 'express'
import { XoRecord } from '@vates/types/xo'

import { BASE_URL } from '../index.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { MaybePromise, WithHref } from '../helpers/helper.type.mjs'

const noop = () => {}

export abstract class BaseController<T extends XoRecord, IsSync extends boolean> extends Controller {
  abstract getObjects(): IsSync extends false ? Promise<Record<T['id'], T>> : Record<T['id'], T>
  abstract getObject(id: T['id']): IsSync extends false ? Promise<T> : T

  restApi: RestApi

  constructor(restApi: RestApi) {
    super()
    this.restApi = restApi
  }

  sendObjects(objects: T[], req: Request): string[] | WithHref<T>[] | WithHref<Partial<T>>[] {
    const mapper = makeObjectMapper(req)
    const mappedObjects = objects.map(mapper) as string[] | WithHref<T>[] | WithHref<Partial<T>>[]

    return mappedObjects
  }

  /**
   * statusCode must represent the status code in case of a synchronous request. Default 200
   */
  async createAction<CbType>(
    cb: () => MaybePromise<CbType>,
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
    const pResult = task.run(cb)

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
}
