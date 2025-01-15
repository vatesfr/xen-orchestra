import { ExtendedRequest } from '../index.js'
import { Controller, Get, Path, Request, Route } from 'tsoa'
import { XoServer } from './server.type.js'

@Route('servers')
export class ServersController extends Controller {
  @Get()
  public getServers(@Request() req: ExtendedRequest): Promise<XoServer[]> {
    return req.xoApp.getAllXenServers()
  }

  @Get('{id}')
  public getServer(@Request() req: ExtendedRequest, @Path() id: XoServer['id']): Promise<XoServer> {
    return req.xoApp.getXenServer(id)
  }
}
