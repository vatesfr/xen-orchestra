import {coroutine, wait} from '../fibers-utils'
import {NoSuchObject, NotImplemented} from '../api-errors'

// ===================================================================

// FIXME: We are storing passwords which is bad!
//        Could we use tokens instead?

export const add = coroutine(function ({host, username, password}) {
  const server = wait(this.servers.add({
    host: host,
    username: username,
    password: password
  }))
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
  }
}

// -------------------------------------------------------------------

export const remove = coroutine(function ({id}) {
  if (!wait(this.servers.remove(id))) {
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

export const getAll = coroutine(function () {
  const servers = wait(this.servers.get())

  for (let i = 0, n = servers.length; i < n; ++i) {
    servers[i] = this.getServerPublicProperties(servers[i])
  }

  return servers
})

getAll.permission = 'admin'

// -------------------------------------------------------------------

export const set = coroutine(function ({id, host, username, password}) {
  const server = wait(this.servers.first(id))
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
  wait(this.servers.update(server))
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

export const connect = function ({id}) {
  const server = wait(this.servers.first(id))
  if (!server) {
    throw new NoSuchObject()
  }

  return this.connectServer(server)
}

connect.permission = 'admin'

connect.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export const disconnect = function ({id}) {
  const server = wait(this.servers.first(id))
  if (!server) {
    throw new NoSuchObject()
  }

  return this.disconnectServer(server)
}

disconnect.permission = 'admin'

disconnect.params = {
  id: {
    type: 'string'
  }
}
