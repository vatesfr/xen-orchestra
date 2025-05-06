import Collection from '../collection/redis.mjs'
import { serializeError } from '../utils.mjs'
import { objectAlreadyExists } from 'xo-common/api-errors.js'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Servers extends Collection {
  _serialize(server) {
    server.allowUnauthorized = server.allowUnauthorized ? 'true' : undefined
    server.enabled = server.enabled ? 'true' : undefined
    const { error } = server
    server.error = error != null ? JSON.stringify(serializeError(error)) : undefined
    server.readOnly = server.readOnly ? 'true' : undefined
  }

  _unserialize(server) {
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
  }

  async create(params) {
    const { host } = params

    if (await this.exists({ host })) {
      const _host = await this.get({ host })
      /* throw */ objectAlreadyExists({
        objectId: _host.id,
        objectType: 'server',
      })
    }

    return /* await */ this.add(params)
  }
}
