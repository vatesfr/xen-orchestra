import * as CM from 'complex-matcher'
import { HttpStatusCodeLiteral } from 'tsoa'
import type { XapiXoRecord } from '@vates/types/xo'

import { BASE_URL } from '../index.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { BaseController } from './base-controller.mjs'

const noop = () => {}

export abstract class XapiXoController<T extends XapiXoRecord> extends BaseController<T, true> {
  #type: T['type']

  constructor(type: T['type'], restApi: RestApi) {
    super(restApi)
    this.#type = type
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
      statusCode?: HttpStatusCodeLiteral
      sync?: boolean
      taskProperties: { name: string; objectId: T['id']; args?: Record<string, unknown>; [key: string]: unknown }
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
      this.setHeader('Content-Type', 'text/plain')

      return location
    }
  }
}
