import { Readable } from 'node:stream'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import type { Xapi, XenApiVdi, XenApiSr, XoHost, XoSr, XoVdi } from '@vates/types'
import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { LicenseService } from '../licenses/license.service.mjs'
import { invalidParameters } from 'xo-common/api-errors.js'
import { getFileNameFromUrl } from '../helpers/utils.helper.mjs'

// Derived from `xapi.SR_create` params, renamed to stay consistent with the XO SR
// representation returned by `GET /srs/:id`: `hostId` (XO id, not XAPI ref),
// `SR_type` and `size` instead of XAPI's `type`/`physical_size`.
// `device_config` is passed through as-is, `shared` is computed from `SR_type`.
export type CreateSrBody = Omit<Parameters<Xapi['SR_create']>[0], 'host' | 'type' | 'physical_size' | 'shared'> & {
  hostId: string
  SR_type: XoSr['SR_type']
  size?: number
}

export type ImportVdiFromUrlBody = {
  url: string
  /** Defaults to the file name in the URL */
  name_label?: string
  name_description?: string
}

// SR types backed by network/SAN storage, every other type is local to the host
const SHARED_SR_TYPES: ReadonlySet<XoSr['SR_type']> = new Set([
  'cephfs',
  'glusterfs',
  'hba',
  'lvmofcoe',
  'lvmohba',
  'lvmoiscsi',
  'moosefs',
  'nfs',
  'smb',
])

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async create(body: CreateSrBody): Promise<XoSr['id']> {
    const { hostId, SR_type, size, ...rest } = body
    if (SR_type === 'linstor') {
      // XOSTOR creation requires dedicated logic (licenses, multi-host setup), not supported yet
      throw new ApiError('SR creation with SR_type "linstor" (XOSTOR) is not implemented yet', 501)
    }
    const xapiHost = this.#restApi.getXapiObject<XoHost>(hostId as XoHost['id'], 'host')
    const ref = await xapiHost.$xapi.SR_create({
      ...rest,
      // XAPI expects ISO libraries to have an `iso` content type
      ...(SR_type === 'iso' && { content_type: 'iso' as const }),
      host: xapiHost.$ref,
      physical_size: size,
      // an ISO SR is local only when it targets a local path (`legacy_mode`), same rules as xo-server `sr.createIso`
      shared: SR_type === 'iso' ? rest.device_config.legacy_mode !== 'true' : SHARED_SR_TYPES.has(SR_type),
      type: SR_type,
    })
    return (await xapiHost.$xapi.getField<XenApiSr, 'uuid'>('SR', ref, 'uuid')) as XoSr['id']
  }

  async delete(id: XoSr['id']): Promise<void> {
    const sr = this.#restApi.getObject<XoSr>(id, 'SR')
    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    const xapi = xapiSr.$xapi

    if (sr.SR_type === 'linstor') {
      const licenseService = this.#restApi.ioc.get(LicenseService)
      const licenses = await licenseService.getXostorLicenses(id)
      await Promise.all(
        licenses.map(({ licenseId, boundObjectId }) =>
          this.#restApi.xoApp.unbindLicense({ licenseId, boundObjectId, productId: 'xostor' })
        )
      )
      try {
        await xapi.xostor_delete(xapiSr.$ref)
      } catch (error) {
        await Promise.all(
          licenses.map(({ licenseId, boundObjectId }) => this.#restApi.xoApp.bindLicense({ licenseId, boundObjectId }))
        )
        throw error
      }
    } else {
      await xapi.destroySr(id)
    }
  }

  async importVdiFromUrl(id: XoSr['id'], body: ImportVdiFromUrlBody): Promise<XoVdi['id']> {
    let url: URL
    try {
      url = new URL(body.url)
    } catch {
      throw invalidParameters('invalid URL')
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw invalidParameters(`unsupported protocol ${url.protocol}, expected http: or https:`)
    }
    // rejected by `fetch` anyway
    if (url.username !== '' || url.password !== '') {
      throw invalidParameters('credentials in the URL are not supported')
    }
    // never put the full URL in errors, it can contain secrets
    const { origin } = url

    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    const xapi = xapiSr.$xapi

    // XO ISO libraries (local, NFS, SMB) are all created with type and content_type `iso`,
    // this excludes the XCP-ng tools SR and the DVD drives SR (type `udev`)
    if (xapiSr.content_type !== 'iso' || xapiSr.type !== 'iso' || xapiSr.is_tools_sr) {
      throw invalidParameters(`SR ${id} is not an ISO SR`)
    }

    let response: Response
    try {
      // `fetch` transparently decompresses gzip, but `Content-Length` would still be the compressed size
      response = await fetch(url, { headers: { 'accept-encoding': 'identity' } })
    } catch (error) {
      throw new Error(`failed to download ${origin}`, { cause: error })
    }
    if (!response.ok) {
      await response.body?.cancel() // free the socket
      throw invalidParameters(`failed to download ${origin}: ${response.status} ${response.statusText}`)
    }
    if (response.body === null) {
      throw new Error(`failed to download ${origin}: empty response body`)
    }

    // raw imports need the size of the VDI before reading the stream
    const contentLength = response.headers.get('content-length')
    if (contentLength === null) {
      await response.body.cancel()
      throw invalidParameters(`the remote server did not provide a Content-Length for ${origin}`)
    }

    const stream: Readable & { length?: number } = Readable.fromWeb(response.body)
    stream.length = +contentLength

    let vdiRef: XenApiVdi['$ref']
    try {
      vdiRef = await xapi.SR_importVdi(xapiSr.$ref, stream, {
        format: SUPPORTED_VDI_FORMAT.raw,
        name_label: body.name_label ?? getFileNameFromUrl(url),
        name_description: body.name_description,
      })
    } catch (error) {
      // the import can fail before reading the stream (e.g. `VDI.create` fails), close the download
      stream.destroy()
      throw error
    }
    const vdiId = await xapi.getField<XenApiVdi, 'uuid'>('VDI', vdiRef, 'uuid')

    return vdiId as XoVdi['id']
  }
}
