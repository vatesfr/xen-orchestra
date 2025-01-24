import { Get, Path, Route, Security } from 'tsoa'
import { XoServer } from './server.type.js'
import { provideSingleton } from '../ioc/helper.js'
import { XoController } from '../abstract/xo.controller.js'

@Route('servers')
@provideSingleton(ServersController)
export class ServersController extends XoController<XoServer> {
  constructor() {
    super('server')
  }

  @Security('token', ['admin'])
  @Get()
  public getServers(): Promise<string[]> {
    return this.getObjectIds()
  }

  @Security('basic_auth', ['admin'])
  @Get('{id}')
  public getServer(@Path() id: XoServer['id']): Promise<XoServer> {
    return this.getObject(id)
  }
}
