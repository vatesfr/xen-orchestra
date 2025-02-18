import * as CM from 'complex-matcher'
import { Controller } from 'tsoa'
import { Request } from 'express'

import { RestApi } from '../rest-api/rest-api.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.mjs'
import type { XapiXoBrandedRecordByType, XapiXoRecordByType } from '../rest-api/rest-api.type.mjs'
import { WithHref } from '../helpers/helpers.type.mjs'

export abstract class XapiXoController<T extends keyof XapiXoRecordByType> extends Controller {
  #type: T
  restApi: RestApi

  constructor(type: T, restApi: RestApi) {
    super()
    this.#type = type
    this.restApi = restApi
  }

  getObjects({ filter, limit }: { filter?: string; limit?: number } = {}): XapiXoBrandedRecordByType[T] {
    if (filter !== undefined) {
      filter = CM.parse(filter).createPredicate()
    }
    return this.restApi.getObjectsByType(this.#type, { filter, limit })
  }

  getObject(id: XapiXoRecordByType[T]['id']): XapiXoRecordByType[T] {
    return this.restApi.getObject(id, this.#type)
  }

  sendObjects(objects: XapiXoRecordByType[T][], req: Request): string[] | WithHref<Partial<XapiXoRecordByType[T]>>[] {
    const mapper = makeObjectMapper(req)
    return objects.map(mapper)
  }
}
