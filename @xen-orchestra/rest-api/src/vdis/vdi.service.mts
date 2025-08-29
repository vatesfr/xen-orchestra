import type { SUPPORTED_VDI_FORMAT, XoVdi, XoVdiSnapshot } from '@vates/types'
import type { Readable } from 'node:stream'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { Response as ExResponse } from 'express'
import { MaybeWithLength } from '../helpers/helper.type.mjs'

export class VdiService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async exportContent(
    id: XoVdi['id'] | XoVdiSnapshot['id'],
    { format, response }: { format: SUPPORTED_VDI_FORMAT; response?: ExResponse }
  ): Promise<MaybeWithLength<Readable>> {
    const xapiVdi = this.#restApi.getXapiObject<XoVdi | XoVdiSnapshot>(id, ['VDI', 'VDI-snapshot'])
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
