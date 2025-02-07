import { FormField, Get, Middlewares, Path, Post, Put, Query, Request, Res, Response, Route, UploadedFile } from 'tsoa'
import { Request as ExRequest, Response as ExResp } from 'express'

import { provideSingleton } from '../ioc/helper.js'
import { XapiXoController } from '../abstract/xapi-xo.controller.js'
import { pipeline } from 'node:stream/promises'

@Route('vdis')
@provideSingleton(VdiController)
export class VdiController extends XapiXoController<any> {
  constructor() {
    super('VDI')
  }
  /**
   * Some description
   */
  @Get()
  @Response(401, 'unautorhized')
  public getVdis(): string[] {
    return this.getObjectIds()
  }

  @Get('{id}.{format}')
  public async exportVdi(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() format: 'vhd' | 'raw',
    @Query() nbdConcurrency: number,
    @Query() perferNbd = false
  ) {
    const res = req.res!
    const vdi = this.getXapiObject(id) as any
    const stream = await vdi.$exportContent({ format, perferNbd, nbdConcurrency })
    const headers = { 'content-disposition': 'attachment', 'content-length': undefined }

    const { length } = stream
    if (length !== undefined) {
      headers['content-length'] = length
    }
    res.writeHead(200, 'OK', headers)
    await pipeline(stream, res)
  }

  @Get('{id}')
  @Response(404, 'Not found')
  @Response(401, 'unautorhized')
  public getVdi(@Path() id: string) {
    return this.getById(id)
  }
}
