import Collection from '../collection/redis.mjs'
import { forEach, serializeError } from '../utils.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Servers extends Collection {
  async create(params) {
    const { host } = params

    if (await this.exists({ host })) {
      throw new Error('server already exists')
    }

    return /* await */ this.add(params)
  }

  async get(properties) {
    const servers = await super.get(properties)

    // Deserializes
    forEach(servers, server => {
      server.allowUnauthorized = server.allowUnauthorized === 'true'
      server.enabled = server.enabled === 'true'
      if (server.error) {
        server.error = parseProp('server', server, 'error', '')
      } else {
        delete server.error
      }
      server.readOnly = server.readOnly === 'true'

      // see https://github.com/vatesfr/xen-orchestra/issues/6656
      if (server.httpProxy === '') {
        delete server.httpProxy
      }
    })

    return servers
  }

  _update(servers) {
    servers.forEach(server => {
      server.allowUnauthorized = server.allowUnauthorized ? 'true' : undefined
      server.enabled = server.enabled ? 'true' : undefined
      const { error } = server
      server.error = error != null ? JSON.stringify(serializeError(error)) : undefined
      server.readOnly = server.readOnly ? 'true' : undefined
    })
    return super._update(servers)
  }
}
