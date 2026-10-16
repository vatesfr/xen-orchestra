import type { EsxiConnectionParams } from '@vates/types'

import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { V2vConnection, V2vInventory } from './v2v.type.mjs'

export class V2vService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * The SOAP client and the HTTP downloads of the disks both take the port as part of the host
   */
  static toConnectionParams({ host, port, username, password, skipSslCheck = false }: V2vConnection) {
    let address = host.trim()
    // an IPv6 address has to be bracketed to be followed by a port
    const isIpv6 = address.split(':').length > 2 && !address.startsWith('[')
    if (isIpv6) {
      address = `[${address}]`
    }
    if (port !== undefined && port !== 443) {
      address = `${address}:${port}`
    }
    return {
      host: address,
      user: username,
      password,
      sslVerify: !skipSslCheck,
    } satisfies EsxiConnectionParams
  }

  async getInventory(connection: V2vConnection): Promise<V2vInventory> {
    try {
      const inventory = await this.#restApi.xoApp.getEsxiInventory(V2vService.toConnectionParams(connection))
      return { platform: 'vmware', ...inventory }
    } catch (error) {
      throw toSourceError(error, connection.host)
    }
  }
}

/**
 * A failure of the source is not a failure of XO: an invalid login is the answer the first step of the
 * wizard waits for
 */
function toSourceError(error: unknown, host: string): unknown {
  if (!(error instanceof Error)) {
    return error
  }
  const code = 'code' in error ? error.code : undefined
  if (code === 'InvalidLogin') {
    const apiError = new ApiError('invalid credentials for the source', 400, {
      data: { code, host },
    })
    apiError.cause = error
    return apiError
  }
  return error
}
