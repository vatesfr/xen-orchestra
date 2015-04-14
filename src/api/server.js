import {coroutine} from 'bluebird'
import {JsonRpcError, NoSuchObject} from '../api-errors'

// ===================================================================

// FIXME: We are storing passwords which is bad!
//        Could we use tokens instead?

export const add = coroutine(function * ({
  host,
  username,
  password,
  autoConnect = true
}) {
  const server = yield this.servers.add({
    host: host,
    username: username,
    password: password
  })

  if (autoConnect) {
    // Connect asynchronously, ignore any error.
    this.connectServer(server).catch(() => {})
  }

  return server.get('id')
})

add.description = 'Add a new Xen server to XO'

add.permission = 'admin'

add.params = {
  host: {
    type: 'string'
  },
  username: {
    type: 'string'
  },
  password: {
    type: 'string'
  },
  autoConnect: {
    optional: true,
    type: 'boolean'
  }
}

// -------------------------------------------------------------------

export const remove = coroutine(function * ({id}) {
  try {
    yield this.disconnectServer(id)
  } catch (error) {}

  if (!(yield this.servers.remove(id))) {
    throw new NoSuchObject()
  }
})

remove.permission = 'admin'

remove.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export const getAll = coroutine(function * () {
  const servers = yield this.servers.get()

  for (let i = 0, n = servers.length; i < n; ++i) {
    servers[i] = this.getServerPublicProperties(servers[i])
  }

  return servers
})

getAll.permission = 'admin'

// -------------------------------------------------------------------

export const set = coroutine(function * ({id, host, username, password}) {
  const server = yield this.servers.first(id)
  if (!server) {
    throw new NoSuchObject()
  }
  if (host != null) {
    server.set({
      host: host
    })
  }
  if (username != null) {
    server.set({
      username: username
    })
  }
  if (password != null) {
    server.set({
      password: password
    })
  }
  yield this.servers.update(server)
})

set.permission = 'admin'

set.params = {
  id: {
    type: 'string'
  },
  host: {
    type: 'string',
    optional: true
  },
  username: {
    type: 'string',
    optional: true
  },
  password: {
    type: 'string',
    optional: true
  }
}

// -------------------------------------------------------------------

export const connect = coroutine(function * ({id}) {
  const server = yield this.servers.first(id)
  if (!server) {
    throw new NoSuchObject()
  }

  try {
    yield this.connectServer(server)
  } catch (error) {
    if (error.code === 'SESSION_AUTHENTICATION_FAILED') {
      throw new JsonRpcError('authentication failed')
    }

    throw error
  }
})

connect.permission = 'admin'

connect.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export const disconnect = coroutine(function * ({id}) {
  const server = yield this.servers.first(id)
  if (!server) {
    throw new NoSuchObject()
  }

  return this.disconnectServer(server)
})

disconnect.permission = 'admin'

disconnect.params = {
  id: {
    type: 'string'
  }
}
