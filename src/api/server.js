import { noop } from '../utils'

export async function add ({
  host,
  username,
  password,
  autoConnect = true
}) {
  const server = await this.registerXenServer({host, username, password})

  if (autoConnect) {
    // Connect asynchronously, ignore any error.
    this.connectXenServer(server.id).catch(() => {})
  }

  return server.id
}

add.description = 'register a new Xen server'

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

export async function remove ({id}) {
  await this.unregisterXenServer(id)
}

remove.description = 'unregister a Xen server'

remove.permission = 'admin'

remove.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

// TODO: remove this function when users are integrated to the main
// collection.
export async function getAll () {
  const servers = await this._servers.get()

  for (let i = 0, n = servers.length; i < n; ++i) {
    servers[i] = this.getServerPublicProperties(servers[i])
  }

  return servers
}

getAll.description = 'returns all the registered Xen server'

getAll.permission = 'admin'

// -------------------------------------------------------------------

export async function set ({id, host, username, password}) {
  await this.updateXenServer(id, {host, username, password})
}

set.description = 'changes the properties of a Xen server'

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

export async function connect ({id}) {
  this.updateXenServer(id, {enabled: true}).catch(noop)
  await this.connectXenServer(id)
}

connect.description = 'connect a Xen server'

connect.permission = 'admin'

connect.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export async function disconnect ({id}) {
  this.updateXenServer(id, {enabled: false}).catch(noop)
  await this.disconnectXenServer(id)
}

disconnect.description = 'disconnect a Xen server'

disconnect.permission = 'admin'

disconnect.params = {
  id: {
    type: 'string'
  }
}
