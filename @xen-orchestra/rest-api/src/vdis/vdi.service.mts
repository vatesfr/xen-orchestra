import { createLogger } from '@xen-orchestra/log'
import { toQcow2Stream } from '@xen-orchestra/qcow2'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { VHD_MAX_SIZE, XapiDiskSource } from '@xen-orchestra/xapi'
import type { Disk } from '@xen-orchestra/disk-transform'
import type { XoVdi, XoVdiSnapshot } from '@vates/types'
import type { Readable } from 'node:stream'

import { ApiError } from '../helpers/error.helper.mjs'
import type { MaybePromise } from '../helpers/helper.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:vdi-service')

type ExportedContentStream = Readable & { length?: number }

export class VdiService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * Open a `XapiDiskSource` on the VDI and let `toStream` rebuild the wanted format
   * from its blocks, instead of relying on the export of the XAPI: this uses NBD when
   * it is available, whatever the format the VDI is stored in, and gives the exact
   * size of the export in advance.
   */
  async #exportContentFromDiskSource<Vdi extends XoVdi | XoVdiSnapshot>(
    id: Vdi['id'],
    type: Vdi['type'],
    toStream: (disk: Disk) => MaybePromise<ExportedContentStream>
  ): Promise<ExportedContentStream> {
    const { $ref: vdiRef, $xapi: xapi } = this.#restApi.getXapiObject<Vdi>(id, type)
    const disk = new XapiDiskSource({ xapi, vdiRef })
    await disk.init()

    const closeDisk = () =>
      disk.close().catch(error => log.warn('failed to close the disk source', { error, vdiId: id }))

    try {
      const stream = await toStream(disk)

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
   * A raw export is a byte for byte copy of the disk: its size is the virtual size of
   * the VDI, even though the XAPI does not announce it.
   */
  async #exportContentAsRaw<Vdi extends XoVdi | XoVdiSnapshot>(
    id: Vdi['id'],
    type: Vdi['type']
  ): Promise<ExportedContentStream> {
    // `virtual_size` is read from the XAPI record, which is fetched anyway to get the
    // ref: no extra object lookup, and no `VDI.get_virtual_size` call
    const { $ref: vdiRef, $xapi: xapi, virtual_size: size } = this.#restApi.getXapiObject<Vdi>(id, type)

    const stream = await xapi.VDI_exportContent(vdiRef, { format: SUPPORTED_VDI_FORMAT.raw })
    stream.length = size

    return stream
  }

  /**
   * `length` is set on the returned stream: the size of the export is always known in
   * advance, it's up to the caller to expose it as a `content-length`.
   */
  async exportContent<Vdi extends XoVdi | XoVdiSnapshot>(
    id: Vdi['id'],
    type: Vdi['type'],
    { format }: { format: SUPPORTED_VDI_FORMAT }
  ): Promise<ExportedContentStream> {
    if (format === SUPPORTED_VDI_FORMAT.vhd) {
      const { size } = this.#restApi.getObject<Vdi>(id, type)
      if (size > VHD_MAX_SIZE) {
        throw new ApiError(`a VDI of ${size} bytes is too large to be exported as VHD`, 422, {
          data: { maxSize: VHD_MAX_SIZE, size },
        })
      }

      return this.#exportContentFromDiskSource<Vdi>(id, type, disk => toVhdStream(disk))
    }

    if (format === SUPPORTED_VDI_FORMAT.qcow2) {
      return this.#exportContentFromDiskSource<Vdi>(id, type, disk => toQcow2Stream(disk))
    }

    return this.#exportContentAsRaw<Vdi>(id, type)
  }
}
