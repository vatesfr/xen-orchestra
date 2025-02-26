import * as CM from 'complex-matcher'
import type { NonXapiXoRecord } from '@vates/types/xo'

import { BaseController } from './base-controller.mjs'

import { RestApi } from '../rest-api/rest-api.mjs'

export abstract class XoController<T extends NonXapiXoRecord> extends BaseController<T, false> {
  abstract _abstractGetObjects(): Promise<T[]>
  abstract _abstractGetObject(id: T['id']): Promise<T>

  constructor(restApi: RestApi) {
    super(restApi)
  }

  async getObjects({
    filter,
    limit,
  }: {
    filter?: string
    limit?: number
  } = {}): Promise<Record<T['id'], T>> {
    const _limit = limit ?? Infinity
    let objects = await this._abstractGetObjects()

    if (filter !== undefined) {
      const predicate = CM.parse(filter).createPredicate()
      objects = objects.filter(predicate)
    }

    if (_limit < objects.length) {
      objects.length = _limit
    }

    const objectById = {} as Record<T['id'], T>

    objects.forEach(obj => {
      objectById[obj.id] = obj
    })

    return objectById
  }

  async getObject(id: T['id']): Promise<T> {
    return this._abstractGetObject(id)
  }
}
