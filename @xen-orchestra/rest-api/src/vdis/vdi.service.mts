import type { SUPPORTED_VDI_FORMAT, XoVdi, XoVdiSnapshot } from '@vates/types'
import type { Readable } from 'node:stream'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { Response as ExResponse } from 'express'

export class VdiService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async exportContent<Vdi extends XoVdi | XoVdiSnapshot>(
    id: Vdi['id'],
    type: Vdi['type'],
    { format, response }: { format: SUPPORTED_VDI_FORMAT; response?: ExResponse }
  ): Promise<Readable & { length?: number }> {
    const xapiVdi = this.#restApi.getXapiObject<Vdi>(id, type)
    const stream = await xapiVdi.$xapi.VDI_exportContent(xapiVdi.$ref, { format })

    if (response !== undefined) {
      const headers = new Headers({
        'content-disposition': `attachment; filename=${id}.${format}`,
        'content-type': 'application/octet-stream',
      })

      if (stream.length !== undefined) {
        headers.append('content-length', stream.length.toString())
      }

      response.setHeaders(headers)
    }

    return stream
  }
}
