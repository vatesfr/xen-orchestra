import * as CM from 'complex-matcher'
import type { XapiXoRecord } from '@vates/types/xo'

import { RestApi } from '../rest-api/rest-api.mjs'
import { BaseController } from './base-controller.mjs'

export abstract class XapiXoController<T extends XapiXoRecord> extends BaseController<T, true> {
  #type: T['type']

  constructor(type: T['type'], restApi: RestApi) {
    super(restApi)
    this.#type = type
  }

  getObjects({ filter, limit }: { filter?: string | ((obj: T) => boolean); limit?: number } = {}): Record<T['id'], T> {
    if (filter !== undefined && typeof filter === 'string') {
      filter = CM.parse(filter).createPredicate()
    }
    return this.restApi.getObjectsByType<T>(this.#type, { filter: filter as (obj: XapiXoRecord) => boolean, limit })
  }

  getObject(id: T['id']): T {
    return this.restApi.getObject<T>(id, this.#type)
  }

  getXapiObject(maybeId: T['id'] | T) {
    return this.restApi.getXapiObject<T>(maybeId, this.#type)
  }
}
