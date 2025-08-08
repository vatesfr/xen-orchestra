import { inject } from 'inversify'
import type { NonXapiXoRecord } from '@vates/types/xo'

import { BaseController } from './base-controller.mjs'

import { RestApi } from '../rest-api/rest-api.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'

export abstract class XoController<T extends NonXapiXoRecord> extends BaseController<T, false> {
  abstract getAllCollectionObjects(): Promise<T[]>
  abstract getCollectionObject(id: T['id']): Promise<T>

  constructor(@inject(RestApi) restApi: RestApi) {
    super(restApi)
  }

  async getObjects(opts: { filter?: string; limit?: number } = {}): Promise<Record<T['id'], T>> {
    let objects = await this.getAllCollectionObjects()

    objects = limitAndFilterArray(objects, opts)

    const objectById = {} as Record<T['id'], T>

    objects.forEach(obj => {
      objectById[obj.id] = obj
    })

    return objectById
  }

  async getObject(id: T['id']): Promise<T> {
    return this.getCollectionObject(id)
  }
}
