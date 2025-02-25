import * as CM from 'complex-matcher'
import { Controller } from 'tsoa'
import { Request } from 'express'
import type { XapiXoRecord } from '@vates/types/xo'

import { BASE_URL } from '../index.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'

const noop = () => {}

export abstract class XapiXoController<T extends XapiXoRecord> extends Controller {
  #type: T['type']
  restApi: RestApi

  constructor(type: T['type'], restApi: RestApi) {
    super()
    this.#type = type
    this.restApi = restApi
  }

  getObjects({ filter, limit }: { filter?: string; limit?: number } = {}): Record<T['id'], T> {
    if (filter !== undefined) {
      filter = CM.parse(filter).createPredicate()
    }
    return this.restApi.getObjectsByType<T>(this.#type, { filter, limit })
  }

  getObject(id: T['id']): T {
    return this.restApi.getObject<T>(id, this.#type)
  }

  sendObjects(objects: T[], req: Request): string[] | WithHref<T>[] | WithHref<Partial<T>>[] {
    const mapper = makeObjectMapper(req)
    const mappedObjects = objects.map(mapper) as string[] | WithHref<T>[] | WithHref<Partial<T>>[]

    return mappedObjects
  }

  getXapiObject(maybeId: T['id'] | T) {
    return this.restApi.getXapiObject<T>(maybeId, this.#type)
  }

  /**
   * statusCode must represent the status code in case of a synchronous request. Default 200
   */
  async createAction<CbType>(
    cb: () => CbType,
    {
      statusCode = 200,
      sync = false,
      taskProperties,
    }: {
      statusCode?: number
      sync?: boolean
      taskProperties: { name: string; objectId: T['id']; [key: string]: unknown }
    }
  ) {
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

      return location
    }
  }
}
