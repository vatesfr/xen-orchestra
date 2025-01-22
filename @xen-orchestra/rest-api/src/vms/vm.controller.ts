import { Controller, Get, Path, Route } from 'tsoa'
import { getRestApi } from '../index.js'

import { XoVm } from './vm.type.js'

@Route('vms')
export class VmsController extends Controller {
  readonly #type = 'VM'

  /**
   * Some description
   */
  @Get()
  public getVms(): XoVm[] {
    const restApi = getRestApi()
    const vms = restApi.getObjects<XoVm>({
      filter: obj => obj.type === 'VM',
    })

    return Object.values(vms)
  }

  @Get('{id}')
  public getVm(@Path() id: string): XoVm {
    const restApi = getRestApi()
    return restApi.getObject(id, this.#type)
  }
}
