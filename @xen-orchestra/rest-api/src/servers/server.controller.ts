import { getRestApi } from '../index.js'
import { Controller, Get, Path, Route } from 'tsoa'
import { XoServer } from './server.type.js'

@Route('servers')
export class ServersController extends Controller {
  #restApi
  constructor() {
    super()
    this.#restApi = getRestApi()
  }
  @Get()
  public getServers(): Promise<XoServer[]> {
    return this.#restApi.getServers()
  }

  @Get('{id}')
  public getServer(@Path() id: XoServer['id']): Promise<XoServer> {
    return this.#restApi.getServer(id)
  }
}
