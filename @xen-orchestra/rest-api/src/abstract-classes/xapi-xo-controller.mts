import * as CM from 'complex-matcher'
import { Controller } from 'tsoa'
import { Request } from 'express'
import type { XapiXoRecord } from '@vates/types/xo'

import { RestApi } from '../rest-api/rest-api.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'

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
}
