import type { XoHost, XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

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
      const poolHosts = Object.values(
        this.#restApi.getObjectsByType<XoHost>('host', {
          filter: host => host.$pool === sr.$container || host.$pool === sr.$pool,
        })
      )

      await xapi.xostor_destroy(xapiSr.$ref)

      await Promise.all(
        poolHosts.map(host =>
          this.#restApi.xoApp.unbindLicense({
            boundObjectId: host.id,
            productId: 'xostor',
          })
        )
      )
    } else {
      await Promise.all(xapiSr.PBDs.map(pbdRef => xapi.callAsync('PBD.unplug', pbdRef)))
      await xapi.call('SR.destroy', xapiSr.$ref)
    }
  }
}
