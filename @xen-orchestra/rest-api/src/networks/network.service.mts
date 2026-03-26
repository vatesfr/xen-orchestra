import type { CreateBondedNetworkBody, CreateInternalNetworkBody, CreateNetworkBody } from '../pools/pool.type.mjs'
import type { ReplaceKey } from '../helpers/helper.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { Xapi, XenApiNetworkWrapped, XoNetwork, XoPool } from '@vates/types'

export class NetworkService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async create(
    poolId: XoPool['id'],
    body: ReplaceKey<CreateNetworkBody, 'pif', 'pifId'> | CreateBondedNetworkBody | CreateInternalNetworkBody
  ): Promise<XoNetwork['id']> {
    const xapiPool = this.#restApi.getXapiObject<XoPool>(poolId, 'pool')
    const xapi = xapiPool.$xapi

    let xapiNetwork: XenApiNetworkWrapped

    const { nbd, ...rest } = body
    const createParams: Parameters<Xapi['createBondedNetwork']>[0] | Parameters<Xapi['createNetwork']>[0] = rest

    if ('pifIds' in createParams) {
      xapiNetwork = await xapi.createBondedNetwork(createParams)
    } else {
      xapiNetwork = await xapi.createNetwork(createParams)
    }

    if (nbd) {
      await xapiNetwork.$call('add_purpose', 'nbd')
    }

    return xapiNetwork.uuid as XoNetwork['id']
  }
}
