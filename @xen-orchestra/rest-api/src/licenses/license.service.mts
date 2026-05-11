import { createLogger } from '@xen-orchestra/log'
import type { XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:license-service')

export class LicenseService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async unbindXostorLicenses(srId: XoSr['id']): Promise<{ licenseId: string; boundObjectId: string }[]> {
    const xapiSr = this.#restApi.getXapiObject<XoSr>(srId, 'SR')
    const xapi = xapiSr.$xapi
    const licenses = await this.#restApi.xoApp.getLicenses({ productType: 'xostor' })

    const unbound: { licenseId: string; boundObjectId: string }[] = []

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
        unbound.push({ licenseId: license.id, boundObjectId: host.uuid })
      })
    )

    return unbound
  }

  async rebindXostorLicenses(bindings: { licenseId: string; boundObjectId: string }[]): Promise<void> {
    await Promise.all(
      bindings.map(({ licenseId, boundObjectId }) => this.#restApi.xoApp.bindLicense({ licenseId, boundObjectId }))
    )
  }
}
