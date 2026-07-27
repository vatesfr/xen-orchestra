import type { Xapi, XenApiSr, XoHost, XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import { LicenseService } from '../licenses/license.service.mjs'

// Derived from `xapi.SR_create` params, renamed to stay consistent with the XO SR
// representation returned by `GET /srs/:id`: `hostId` (XO id, not XAPI ref),
// `SR_type` and `size` instead of XAPI's `type`/`physical_size`.
// `device_config` is passed through as-is, `shared` is computed from `SR_type`.
export type CreateSrBody = Omit<Parameters<Xapi['SR_create']>[0], 'host' | 'type' | 'physical_size' | 'shared'> & {
  hostId: string
  SR_type: XoSr['SR_type']
  size?: number
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
}
