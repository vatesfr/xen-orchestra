import { getRestApi } from '../index.js'
import { XapiXoObject } from '../xoApp.type.js'
import { Controller } from 'tsoa'

export abstract class XapiXoController<T extends XapiXoObject> extends Controller {
  #restApi = getRestApi()
  #type
  constructor(type: T['type']) {
    super()
    this.#type = type
  }

  // wrap these methods with permission (filter only objects that the users can see)
  protected getObjects(): Record<T['id'], T> | undefined {
    return this.#restApi.getObjectsByType(this.#type) as Record<T['id'], T> | undefined
  }
  protected getById(id: T['id']): T {
    return this.#restApi.getObject(id, this.#type) as T
  }
  // --------------------------------------------------------------------------------

  protected getObjectIds(): T['id'][] {
    return Object.keys(this.getObjects() ?? {})
  }
}
