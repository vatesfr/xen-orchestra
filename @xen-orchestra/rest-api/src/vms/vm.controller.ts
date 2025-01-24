import { Get, Path, Route } from 'tsoa'

import { XoVm } from './vm.type.js'
import { provideSingleton } from '../ioc/helper.js'
import { XapiXoController } from '../abstract/xapi-xo.controller.js'

@Route('vms')
@provideSingleton(VmsController)
export class VmsController extends XapiXoController<XoVm> {
  constructor() {
    super('VM')
  }
  /**
   * Some description
   */
  @Get()
  public getVms(): XoVm['id'][] {
    return this.getObjectIds()
  }

  @Get('{id}')
  public getVm(@Path() id: XoVm['id']) {
    return this.getById(id)
  }
}
