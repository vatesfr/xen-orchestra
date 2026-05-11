import type { XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { LicenseService } from '../licenses/license.service.mjs'

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async delete(id: XoSr['id']): Promise<void> {
    const sr = this.#restApi.getObject<XoSr>(id, 'SR')
    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    const xapi = xapiSr.$xapi

    if (sr.SR_type === 'linstor') {
      const licenseService = this.#restApi.ioc.get(LicenseService)
      const bindings = await licenseService.unbindXostorLicenses(id)
      try {
        await xapi.xostor_delete(xapiSr.$ref)
      } catch (error) {
        await licenseService.rebindXostorLicenses(bindings)
        throw error
      }
    } else {
      await xapi.destroySr(id)
    }
  }
}
