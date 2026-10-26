import { createLogger } from '@xen-orchestra/log'
import { ApiError } from '../helpers/error.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:kubernetes-config')

const DEV_URL = 'http://10.30.138.1:30080/'

/**
 * Returns the normalized kubernetes proxy CAPI URL.
 *
 * TODO: replace with dynamic URL stored in REDIS.
 */
export async function getCAPIUrl(restApi: RestApi): Promise<string> {
  let CAPIUrl = DEV_URL

  const configCAPIUrl = restApi.xoApp.config.getOptional<string>('rest-api.kubernetesProxyUrl')
  if (configCAPIUrl !== undefined) CAPIUrl = configCAPIUrl

  let url: URL
  try {
    url = new URL(CAPIUrl)
  } catch (error) {
    log.warn(`CAPI proxy URL at ${CAPIUrl} malformed`, error)

    throw new ApiError(`CAPI proxy URL "${CAPIUrl}" malformed`, 503)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ApiError(`CAPI proxy URL "${CAPIUrl}" unsupported protocol`, 503)
  }

  return url.href.replace(/\/+$/, '')
}
