import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

import { parseProp } from './utils'

// ===================================================================

export default class Server extends Model {}

// -------------------------------------------------------------------

export class Servers extends Collection {
  get Model () {
    return Server
  }

  async create ({host, username, password, readOnly}) {
    if (await this.exists({host})) {
      throw new Error('server already exists')
    }

    return /* await */ this.add({host, username, password, readOnly})
  }

  async get (properties) {
    const servers = await super.get(properties)

    // Deserializes
    forEach(servers, server => {
      if (server.error) {
        server.error = parseProp('server', server, 'error', '')
      } else {
        delete server.error
      }
    })

    return servers
  }
}
