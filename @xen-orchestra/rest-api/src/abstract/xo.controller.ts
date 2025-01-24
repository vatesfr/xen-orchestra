import { getRestApi } from '../index.js'
import { NonXapiObject } from '../xoApp.type.js'
import { Controller } from 'tsoa'

type XoType = 'server'

export abstract class XoController<T extends NonXapiObject> extends Controller {
  #restApi = getRestApi()
  #type: XoType

  #fnByType = {
    server: {
      getAll: () => this.#restApi.getServers(),
      getById: (id: NonXapiObject['id']) => this.#restApi.getServer(id),
    },
  }

  constructor(type: XoType) {
    super()
    this.#type = type
  }

  protected getObjects() {
    return this.#fnByType[this.#type].getAll()
  }

  protected getObject(id: T['id']) {
    return this.#fnByType[this.#type].getById(id)
  }
  protected async getObjectIds(): Promise<NonXapiObject['id'][]> {
    const objects = await this.getObjects()
    if (Array.isArray(objects)) {
      return objects.map(obj => obj.id)
    }
    return Object.keys(objects)
  }
}
