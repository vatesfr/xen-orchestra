import { Get, Path, Post, Response, Route } from 'tsoa'

import { XapiVm, XoVm } from './vm.type.js'
import { provideSingleton } from '../ioc/helper.js'
import { XapiXoController } from '../abstract/xapi-xo.controller.js'

interface ApiError {
  error: string
}

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
  @Response<ApiError>(404, 'Not found')
  @Response<ApiError>(401, 'unautorhized')
  public getVm(@Path() id: XoVm['id']) {
    return this.getById(id)
  }

  @Post('{id}/actions/start')
  @Response(404, 'Not found')
  public startVm(@Path() id: XoVm['id']): void {
    const vm = this.restApi.getXapiObject(id, this.type) as XapiVm
    // create task and add the possibility to watch/await the task
    vm.$callAsync<void>('start', false, false).catch(() => {})
  }
}
