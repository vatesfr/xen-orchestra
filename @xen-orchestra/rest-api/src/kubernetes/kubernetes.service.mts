import { createLogger } from '@xen-orchestra/log'
import { RestApi } from '../rest-api/rest-api.mjs'
import { getCAPIUrl } from './kubernetes.config.mjs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { type Request as ExRequest, type Response as ExResponse } from 'express'
import { ApiError } from '../helpers/error.helper.mjs'
import { XoApp } from '@vates/types'
import { HttpStatusCodeLiteral } from 'tsoa'

const log = createLogger('xo:rest-api:kubernetes-service')

const CAPI_SPEC_PATH = 'swagger/openapi.json'

const DEFAULT_TIMEOUT = 10e3

const RELAYED_CAPI_STATUSES = new Set<number>([400, 401, 403, 404, 409, 422, 500, 503])

function isRelayableStatus(status: number): status is HttpStatusCodeLiteral {
  return RELAYED_CAPI_STATUSES.has(status)
}

export class KubernetesService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * Forwards a REST request to CAPI and parsing the result
   */
  async forwardRequest(CAPIPath: string, req: ExRequest, res: ExResponse): Promise<void> {
    let CAPIUrl = await this.#getTargetUrl(CAPIPath)
    const queryStart = req.url.indexOf('?')
    if (queryStart !== -1) CAPIUrl += req.url.slice(queryStart)

    const hasBody =
      (req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) ||
      req.headers['transfer-encoding'] !== undefined

    const headers: Record<string, string> = {}
    if (req.headers.accept) headers.accept = req.headers.accept
    if (hasBody) {
      if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']
      if (req.headers['content-length']) headers['content-length'] = req.headers['content-length']
    }

    const reqOpts: NonNullable<Parameters<XoApp['httpRequest']>[1]> = {
      bypassStatusCheck: true,
      headers,
      method: req.method,
    }
    if (hasBody) {
      reqOpts.body = req
    }

    const CAPIRes = await this.#getResponse(CAPIUrl, reqOpts)

    res.status(CAPIRes.status)
    const CAPIResContentType = CAPIRes.headers.get('content-type')
    if (CAPIResContentType !== null) res.contentType(CAPIResContentType)

    if (CAPIRes.body) {
      await pipeline(Readable.fromWeb(CAPIRes.body), res)
    } else {
      res.end()
    }
  }

  /**
   * Fetches the OpenAPI specification of CAPI
   */
  async getCAPISpec(): Promise<unknown> {
    const CAPIUrl = await this.#getTargetUrl(CAPI_SPEC_PATH)

    const CAPIRes = await this.#getResponse(CAPIUrl, {
      bypassStatusCheck: true,
      headers: { accept: 'application/json' },
      method: 'GET',
    })

    if (!CAPIRes.ok) {
      throw await this.#getCAPIError(CAPIUrl, CAPIRes)
    }

    return CAPIRes.body === null || CAPIRes.status === 204 ? undefined : await CAPIRes.json()
  }

  /**
   * Builds the error to throw when CAPI answers with an error
   */
  async #getCAPIError(CAPIUrl: string, CAPIRes: Response): Promise<ApiError> {
    let text = (await CAPIRes.text().catch(() => '')).substring(0, 1024)

    try {
      text = JSON.parse(text)
    } catch {
      // This way if the content is not JSON we don't throw.
    }

    let message = `CAPI answered with the status ${CAPIRes.status}`
    if (typeof text === 'object' && text !== null) {
      const { detail, title } = text as { detail?: unknown; title?: unknown }
      if (typeof detail === 'string') {
        message = detail
      } else if (typeof title === 'string') {
        message = title
      }
    }

    log.warn(`CAPI answered with an error at ${CAPIUrl}`, { CAPIError: text, status: CAPIRes.status })

    return new ApiError(message, isRelayableStatus(CAPIRes.status) ? CAPIRes.status : 502, {
      data: { CAPIError: text },
    })
  }

  /**
   * Builds the call CAPI URL
   */
  async #getTargetUrl(CAPIPath: string): Promise<string> {
    return `${await getCAPIUrl(this.#restApi)}/${CAPIPath.replace(/^\//, '')}`
  }

  /**
   * Run the CAPI requests and handle the errors if needed
   */
  async #getResponse(CAPIUrl: string, reqOpts: NonNullable<Parameters<XoApp['httpRequest']>[1]>): Promise<Response> {
    const timeout = this.#restApi.xoApp.config.getOptionalDuration('rest-api.kubernetesProxyTimeout') ?? DEFAULT_TIMEOUT

    try {
      return await this.#restApi.xoApp.httpRequest(CAPIUrl, { timeout, ...reqOpts })
    } catch (error) {
      if (error != null && typeof error === 'object' && 'response' in error) {
        return (error as { response: Response }).response
      } else {
        log.warn(`CAPI unreachable at ${CAPIUrl}`, error)

        throw new ApiError('An error occurred while reaching the CAPI', 503)
      }
    }
  }
}
