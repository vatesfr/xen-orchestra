import {
  Example,
  Extension,
  Get,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoBrowserMediaSession } from '@vates/types'

import {
  asynchronousActionResp,
  badRequestResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import {
  browserMedia,
  browserMediaIds,
  partialBrowserMedia,
} from '../open-api/oa-examples/browser-media.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

/**
 * An ISO selected in a browser, which serves it over a WebSocket: see `POST /vms/{id}/actions/insert_browser_iso`.
 *
 * Experimental, restricted to administrators.
 */
@Route('browser-media')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('browser-media')
@provide(BrowserMediaController)
export class BrowserMediaController extends XoController<XoBrowserMediaSession> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('browser-media', restApi)
  }

  // --- abstract methods
  async getAllCollectionObjects(): Promise<XoBrowserMediaSession[]> {
    return this.restApi.xoApp.getAllBrowserMediaSessions()
  }
  async getCollectionObject(id: XoBrowserMediaSession['id']): Promise<XoBrowserMediaSession> {
    return this.restApi.xoApp.getBrowserMediaSession(id)
  }

  /**
   * Restricted to administrators.
   *
   * Every browser media session, whoever owns it.
   *
   * @example fields "name,status,vmId"
   * @example filter "status:inserted"
   * @example limit 42
   */
  @Example(browserMediaIds)
  @Example(partialBrowserMedia)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getBrowserMediaSessions(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoBrowserMediaSession>>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, { limit })
  }

  /**
   * Restricted to administrators.
   *
   * @example id "3f1d0c9e8b7a6f5e4d3c2b1a09f8e7d6"
   */
  @Example(browserMedia)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getBrowserMediaSession(@Path() id: string): Promise<Unbrand<XoBrowserMediaSession>> {
    return this.getObject(id as XoBrowserMediaSession['id'])
  }

  /**
   * Restricted to administrators.
   *
   * Eject the ISO if it is inserted, release its storage, and disconnect the browser serving it.
   *
   * @example id "3f1d0c9e8b7a6f5e4d3c2b1a09f8e7d6"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/eject')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  ejectBrowserMedia(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const sessionId = id as XoBrowserMediaSession['id']
    const { vmId } = this.restApi.xoApp.getBrowserMediaSession(sessionId)

    return this.createAction<void>(() => this.restApi.xoApp.ejectBrowserMedia(sessionId), {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'eject browser media', objectId: sessionId, args: { vmId } },
    })
  }
}
