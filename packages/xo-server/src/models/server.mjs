import Collection from '../collection/redis.mjs'
import Model from '../model.mjs'
import { forEach, serializeError } from '../utils.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export default class Server extends Model {}

// -------------------------------------------------------------------

export class Servers extends Collection {
  get Model() {
    return Server
  }

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
    })

    return servers
  }

  _update(servers) {
    servers.map(server => {
      server.allowUnauthorized = server.allowUnauthorized ? 'true' : undefined
      server.enabled = server.enabled ? 'true' : undefined
      const { error } = server
      server.error = error != null ? JSON.stringify(serializeError(error)) : undefined
      server.readOnly = server.readOnly ? 'true' : undefined
    })
    return super._update(servers)
  }
}
