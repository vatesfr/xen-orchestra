import { getRestApi } from '../index.js'
import { Controller, Get, Path, Route } from 'tsoa'
import { XoServer } from './server.type.js'

@Route('servers')
export class ServersController extends Controller {
  @Get()
  public getServers(): Promise<XoServer[]> {
    const restApi = getRestApi()
    return restApi.getServers()
  }

  @Get('{id}')
  public getServer(@Path() id: XoServer['id']): Promise<XoServer> {
    const restApi = getRestApi()
    return restApi.getServer(id)
  }
}
