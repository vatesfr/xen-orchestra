import type { Xapi, XenApiSr, XoHost, XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { LicenseService } from '../licenses/license.service.mjs'

// Derived from `xapi.SR_create` params: the REST body takes a host `id` (string)
// instead of the internal XAPI ref. `device_config` is passed through as-is.
export type CreateSrBody = Omit<Parameters<Xapi['SR_create']>[0], 'host'> & { host: string }

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async create(body: CreateSrBody): Promise<XoSr['id']> {
    const { host, ...rest } = body
    const xapiHost = this.#restApi.getXapiObject<XoHost>(host as XoHost['id'], 'host')
    const ref = await xapiHost.$xapi.SR_create({ ...rest, host: xapiHost.$ref })
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
