import * as CM from 'complex-matcher'
import { inject } from 'inversify'
import type { NonXapiXoRecord } from '@vates/types/xo'

import { BaseController } from './base-controller.mjs'

import { RestApi } from '../rest-api/rest-api.mjs'

export abstract class XoController<T extends NonXapiXoRecord> extends BaseController<T, false> {
  abstract _getObjects(): Promise<T[]>
  abstract _getObject(id: T['id']): Promise<T>

  constructor(@inject(RestApi) restApi: RestApi) {
    super(restApi)
  }

  async getObjects({ filter, limit = Infinity }: { filter?: string; limit?: number } = {}): Promise<
    Record<T['id'], T>
  > {
    let objects = await this._getObjects()

    if (filter !== undefined) {
      const predicate = CM.parse(filter).createPredicate()
      objects = objects.filter(predicate)
    }

    if (limit < objects.length) {
      objects.length = limit
    }

    const objectById = {} as Record<T['id'], T>

    objects.forEach(obj => {
      objectById[obj.id] = obj
    })

    return objectById
  }

  async getObject(id: T['id']): Promise<T> {
    return this._getObject(id)
  }
}
