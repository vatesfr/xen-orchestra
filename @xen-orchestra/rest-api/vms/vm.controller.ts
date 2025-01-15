import { Controller, Get, Path, Request, Route } from 'tsoa'
import { ExtendedRequest } from 'index.js'

import { XoVm } from './vm.type.js'

@Route('vms')
export class VmsController extends Controller {
  readonly #type = 'VM'

  /**
   * Some description
   */
  @Get()
  public getVms(@Request() req: ExtendedRequest): XoVm[] {
    const vms = req.xoApp.getObjects<XoVm>({
      filter: obj => obj.type === 'VM',
    })

    return Object.values(vms)
  }

  @Get('{id}')
  public getVm(@Request() req: ExtendedRequest, @Path() id: string): XoVm {
    return req.xoApp.getObject(id, this.#type)
  }
}
