import type { XoHost, XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

export class LicenseService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async unbindXostorLicenses(sr: XoSr): Promise<void> {
    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host')).filter(host => host.$pool === sr.$pool)
    const licenses = await this.#restApi.xoApp.getLicenses({ productType: 'xostor' })

    await Promise.all(
      hosts.map(async host => {
        const license = licenses.find(l => l.boundObjectId === host.id)
        if (license !== undefined) {
          await this.#restApi.xoApp.unbindLicense({
            licenseId: license.id,
            boundObjectId: host.id,
            productId: 'xostor',
          })
        }
      })
    )
  }
}
