import {
  noop,
  pCatch
} from '../utils'

export async function add ({
  host,
  username,
  password,
  readOnly,
  autoConnect = true
}) {
  const server = await this.registerXenServer({host, username, password, readOnly})

  if (autoConnect) {
    // Connect asynchronously, ignore any errors.
    this.connectXenServer(server.id)::pCatch(noop)
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
export function getAll () {
  return this.getAllXenServers()
}

getAll.description = 'returns all the registered Xen server'

getAll.permission = 'admin'

// -------------------------------------------------------------------

export async function set ({id, host, username, password, readOnly}) {
  await this.updateXenServer(id, {host, username, password, readOnly})
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
  this.updateXenServer(id, {enabled: true})::pCatch(noop)
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
  this.updateXenServer(id, {enabled: false})::pCatch(noop)
  await this.disconnectXenServer(id)
}

disconnect.description = 'disconnect a Xen server'

disconnect.permission = 'admin'

disconnect.params = {
  id: {
    type: 'string'
  }
}
