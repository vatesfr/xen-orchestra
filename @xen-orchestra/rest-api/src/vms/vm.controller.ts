import { Controller, Get, Path, Route } from 'tsoa'
import { getRestApi } from '../index.js'

import { XoVm } from './vm.type.js'
import { provideSingleton } from '../ioc/helper.js'

@Route('vms')
@provideSingleton(VmsController)
export class VmsController extends Controller {
  #restApi
  constructor() {
    super()
    this.#restApi = getRestApi()
  }

  /**
   * Some description
   */
  @Get()
  public getVms(): XoVm[] {
    // not working
    const vms = this.#restApi.getObjects<XoVm>({
      filter: obj => obj.type === 'VM',
    })

    return Object.values(vms)
  }

  @Get('{id}')
  public getVm(@Path() id: string): XoVm {
    return this.#restApi.getObject(id, 'VM')
  }
}
