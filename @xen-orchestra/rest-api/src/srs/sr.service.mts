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
      await xapi.xostor_destroy(xapiSr.$ref)

      const poolHosts = Object.values(xapi.objects.indexes.type.host)
      await Promise.all(
        poolHosts.map(host =>
          this.#restApi.xoApp.unbindLicense({
            boundObjectId: host.uuid,
            productId: 'xostor',
          })
        )
      )
    } else {
      await xapi.destroySr(xapiSr.$ref)
    }
  }
}
