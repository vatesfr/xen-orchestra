import { createLogger } from '@xen-orchestra/log'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { VHD_MAX_SIZE, XapiDiskSource } from '@xen-orchestra/xapi'
import type { XoVdi, XoVdiSnapshot } from '@vates/types'
import type { Readable } from 'node:stream'

import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:vdi-service')

type ExportedContentStream = Readable & { length?: number }

export class VdiService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * Rebuild the VHD from a `XapiDiskSource` instead of relying on the VHD export of the XAPI:
   * this uses NBD when it is available and can export a qcow2 backed VDI,
   * it also fixes some edge case of the xapi ( content length/missing task )
   */
  async #exportContentAsVhd<Vdi extends XoVdi | XoVdiSnapshot>(
    id: Vdi['id'],
    type: Vdi['type']
  ): Promise<ExportedContentStream> {
    const { size } = this.#restApi.getObject<Vdi>(id, type)
    if (size > VHD_MAX_SIZE) {
      throw new ApiError(`a VDI of ${size} bytes is too large to be exported as VHD`, 422, {
        data: { maxSize: VHD_MAX_SIZE, size },
      })
    }

    const { $ref: vdiRef, $xapi: xapi } = this.#restApi.getXapiObject<Vdi>(id, type)
    const disk = new XapiDiskSource({ xapi, vdiRef })
    await disk.init()

    const closeDisk = () =>
      disk.close().catch(error => log.warn('failed to close the disk source', { error, vdiId: id }))

    try {
      const stream = await toVhdStream(disk)

      // the block generator of the disk closes it when it ends, but it is never
      // started if the stream is destroyed before being consumed
      stream.once('close', closeDisk)

      return stream
    } catch (error) {
      await closeDisk()
      throw error
    }
  }

  /**
   * `length` is set on the returned stream when the size of the export is known
   * in advance, it's up to the caller to expose it as a `content-length`.
   */
  async exportContent<Vdi extends XoVdi | XoVdiSnapshot>(
    id: Vdi['id'],
    type: Vdi['type'],
    { format }: { format: SUPPORTED_VDI_FORMAT }
  ): Promise<ExportedContentStream> {
    if (format === SUPPORTED_VDI_FORMAT.vhd) {
      return this.#exportContentAsVhd<Vdi>(id, type)
    }

    const xapiVdi = this.#restApi.getXapiObject<Vdi>(id, type)
    return xapiVdi.$xapi.VDI_exportContent(xapiVdi.$ref, { format })
  }
}
