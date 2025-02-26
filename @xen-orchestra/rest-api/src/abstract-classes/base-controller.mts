import { Controller } from 'tsoa'
import { Request } from 'express'
import { XoRecord } from '@vates/types'

import { RestApi } from '../rest-api/rest-api.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'

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
}
