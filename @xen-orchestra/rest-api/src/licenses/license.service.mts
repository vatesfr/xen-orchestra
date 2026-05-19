import { createLogger } from '@xen-orchestra/log'
import type { XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:license-service')

export class LicenseService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getXostorLicenses(srId: XoSr['id']): Promise<{ licenseId: string; boundObjectId: string }[]> {
    const xapiSr = this.#restApi.getXapiObject<XoSr>(srId, 'SR')
    const xapi = xapiSr.$xapi
    const licenses = await this.#restApi.xoApp.getLicenses({ productType: 'xostor' })

    const result: { licenseId: string; boundObjectId: string }[] = []
    for (const host of Object.values(xapi.objects.indexes.type.host)) {
      const license = licenses.find(l => l.boundObjectId === host.uuid)
      if (license === undefined) {
        log.warn('no xostor license found for host', { hostId: host.uuid })
        continue
      }
      result.push({ licenseId: license.id, boundObjectId: host.uuid })
    }
    return result
  }
}
