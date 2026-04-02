import { createLogger } from '@xen-orchestra/log'
import type { XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:license-service')

export class LicenseService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async unbindXostorLicenses(srId: XoSr['id']): Promise<void> {
    const xapiSr = this.#restApi.getXapiObject<XoSr>(srId, 'SR')
    const xapi = xapiSr.$xapi
    const licenses = await this.#restApi.xoApp.getLicenses({ productType: 'xostor' })

    await Promise.all(
      Object.values(xapi.objects.indexes.type.host).map(async host => {
        const license = licenses.find(l => l.boundObjectId === host.uuid)
        if (license === undefined) {
          log.warn('no xostor license found for host', { hostId: host.uuid })
          return
        }
        await this.#restApi.xoApp.unbindLicense({
          licenseId: license.id,
          boundObjectId: host.uuid,
          productId: 'xostor',
        })
      })
    )
  }
}
