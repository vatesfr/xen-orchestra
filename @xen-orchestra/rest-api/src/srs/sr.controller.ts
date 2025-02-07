import { FormField, Get, Middlewares, Path, Post, Put, Query, Request, Response, Route, UploadedFile } from 'tsoa'
import { Request as ExRequest } from 'express'

import { provideSingleton } from '../ioc/helper.js'
import { XapiXoController } from '../abstract/xapi-xo.controller.js'

/**
 * Return a task ID or T if ?watch=true
 */
type WatchAction<T> = string | T

@Route('srs')
@provideSingleton(SrsController)
export class SrsController extends XapiXoController<any> {
  constructor() {
    super('SR')
  }
  /**
   * Some description
   */
  @Get()
  @Response(401, 'unautorhized')
  public getSrs(): string[] {
    return this.getObjectIds()
  }

  @Get('{id}')
  @Response(404, 'Not found')
  @Response(401, 'unautorhized')
  public getSr(@Path() id: string) {
    return this.getById(id)
  }

  @Post('{id}/actions/import_vdi')
  public async importVdi(
    @Request() req: ExRequest & { length: number },
    @Path() id: string,
    @Query() name_label: string,
    @Query() name_description: string,
    @Query() format: 'raw' | 'vhd'
  ): Promise<WatchAction<string>> {
    // create task and add the possibility to watch/await the task
    const sr = this.restApi.getXapiObject(id, this.type) as any
    const length = req.headers['content-length']
    if (length !== undefined) {
      req.length = Number(length)
    }

    const vdiRef = await sr.$importVdi(req, {
      format,
      name_label,
      name_description,
    })
    const vdiUUid = await sr.$xapi.getField('VDI', vdiRef, 'uuid')
    return vdiUUid
  }
}
