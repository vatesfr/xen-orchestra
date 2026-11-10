import {
  Body,
  Controller,
  Example,
  Extension,
  Get,
  Middlewares,
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
import { PassThrough } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import type { Request as ExRequest, Response as ExResponse } from 'express'

import type { PingResponse, XoaDashboard, XoGuiRoutes } from './xoa.type.mjs'
import type { SupportBundleParams } from './support-bundle.type.mjs'

import { guiRoutes } from '../open-api/oa-examples/gui-routes.oa-example.mjs'
import { pingResponse } from '../open-api/oa-examples/ping.oa-example.mjs'
import { badRequestResp, internalServerErrorResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { xoaDashboard } from '../open-api/oa-examples/xoa.oa-example.mjs'
import { XoaService } from './xoa.service.mjs'
import { SupportBundleService } from './support-bundle.service.mjs'
import { NDJSON_CONTENT_TYPE } from '../helpers/utils.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

@Route('')
@Security('*')
@Tags('xoa')
@provide(XoaController)
export class XoaController extends Controller {
  #restApi: RestApi
  #supportBundleService: SupportBundleService
  #xoaService: XoaService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(XoaService) xoaService: XoaService,
    @inject(SupportBundleService) supportBundleService: SupportBundleService
  ) {
    super()
    this.#restApi = restApi
    this.#supportBundleService = supportBundleService
    this.#xoaService = xoaService
  }

  @Example(xoaDashboard)
  @Extension('x-mcp-exposure', 'allow')
  @Get('dashboard')
  @Response(badRequestResp.status, badRequestResp.description)
  @Response(unauthorizedResp.status, unauthorizedResp.description)
  async getDashboard(@Request() req: ExRequest, @Query() ndjson?: boolean): Promise<XoaDashboard | undefined> {
    const stream = ndjson ? new PassThrough() : undefined
    const isStream = ndjson && stream !== undefined
    if (isStream) {
      const res = req.res as ExResponse
      res.setHeader('Content-Type', NDJSON_CONTENT_TYPE)
      stream.pipe(res)
    }

    const dashboard = await this.#xoaService.getDashboard({ stream })

    if (isStream) {
      stream.end()
    } else {
      return dashboard
    }
  }

  /**
   * Admin only
   *
   * Export the state of this XO (XAPI objects, configuration, tasks) to debug it in a dedicated XO.
   *
   * Secrets (credentials, tokens, encryption keys, mount options…) are replaced by a placeholder,
   * and the whole export is encrypted (OpenPGP) with the provided passphrase.
   *
   * The result is gzipped NDJSON once decrypted, the last line is a manifest: an export without it is incomplete,
   * for instance because a secret has been found in an exported value.
   */
  @Extension('x-mcp-exposure', 'deny')
  @Post('xoa/support-bundle')
  @Middlewares(json())
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(badRequestResp.status, badRequestResp.description)
  @Response(unauthorizedResp.status, unauthorizedResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async exportSupportBundle(@Request() req: ExRequest, @Body() body: SupportBundleParams): Promise<void> {
    const stream = await this.#supportBundleService.createExportStream(body)

    const res = req.res as ExResponse
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="xo-support-bundle-${new Date().toISOString()}.ndjson.gz.pgp"`
    )

    await pipeline(stream, res)
  }

  @Security('none')
  @Example(pingResponse)
  @Extension('x-mcp-exposure', 'allow')
  @Get('ping')
  ping(): PingResponse {
    return {
      result: 'pong',
      timestamp: Date.now(),
    }
  }

  @Security('none')
  @Example(guiRoutes)
  @Extension('x-mcp-exposure', 'allow')
  @Get('gui-routes')
  async getGuiRoutes(): Promise<XoGuiRoutes> {
    const { v5, v6 } = await this.#restApi.xoApp.config.getGuiRoutes()

    return {
      xo5: v5?.url,
      xo6: v6?.url,
    }
  }
}
