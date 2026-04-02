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
      await xapi.xostor_delete(xapiSr.$ref)
      await this.#restApi.ioc.get(LicenseService).unbindXostorLicenses(id)
    } else {
      await xapi.destroySr(id)
    }
  }
}
