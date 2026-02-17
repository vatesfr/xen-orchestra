import type { XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async forget(id: XoSr['id']): Promise<void> {
    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    await xapiSr.$xapi.forgetSr(xapiSr.$ref)
  }
}
