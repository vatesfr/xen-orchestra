import type { XapiXoRecord } from '@vates/types/xo'

import { RestApi } from '../rest-api/rest-api.mjs'
import { BaseController } from './base-controller.mjs'

export abstract class XapiXoController<T extends XapiXoRecord> extends BaseController<T, true> {
  #type: T['type']

  constructor(type: T['type'], restApi: RestApi) {
    super(restApi)
    this.#type = type
  }

  getObjects(opts?: { filter?: string | ((obj: T) => boolean); limit?: number }): Record<T['id'], T> {
    return this.restApi.getObjectsByType<T>(this.#type, opts)
  }

  getObject(id: T['id']): T {
    return this.restApi.getObject<T>(id, this.#type)
  }

  getXapiObject(maybeId: T['id'] | T) {
    return this.restApi.getXapiObject<T>(maybeId, this.#type)
  }
}
