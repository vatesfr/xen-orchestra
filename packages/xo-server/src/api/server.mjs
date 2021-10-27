import { ignoreErrors } from 'promise-toolbox'

export async function add({ autoConnect = true, ...props }) {
  const server = await this.registerXenServer(props)

  if (autoConnect) {
    this.connectXenServer(server.id)::ignoreErrors()
  }

  return server.id
}

add.description = 'register a new Xen server'

add.permission = 'admin'

add.params = {
  label: {
    optional: true,
    type: 'string',
  },
  host: {
    type: 'string',
  },
  username: {
    type: 'string',
  },
  password: {
    type: 'string',
  },
  autoConnect: {
    optional: true,
    type: 'boolean',
  },
  allowUnauthorized: {
    optional: true,
    type: 'boolean',
  },
  httpProxy: {
    optional: true,
    type: 'string',
  },
}

// -------------------------------------------------------------------

export async function remove({ id }) {
  await this.unregisterXenServer(id)
}

remove.description = 'unregister a Xen server'

remove.permission = 'admin'

remove.params = {
  id: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

// TODO: remove this function when users are integrated to the main
// collection.
export function getAll() {
  return this.getAllXenServers()
}

getAll.description = 'returns all the registered Xen server'

getAll.permission = 'admin'

// -------------------------------------------------------------------

export async function set({ id, ...props }) {
  await this.updateXenServer(id, props)
}

set.description = 'changes the properties of a Xen server'

set.permission = 'admin'

set.params = {
  id: {
    type: 'string',
  },
  label: {
    type: 'string',
    optional: true,
  },
  host: {
    type: 'string',
    optional: true,
  },
  username: {
    type: 'string',
    optional: true,
  },
  password: {
    type: 'string',
    optional: true,
  },
  allowUnauthorized: {
    optional: true,
    type: 'boolean',
  },
  readOnly: {
    optional: true,
    type: 'boolean',
  },
  httpProxy: {
    optional: true,
    type: ['string', 'null'],
  },
}

// -------------------------------------------------------------------

export async function enable({ id }) {
  this.updateXenServer(id, { enabled: true })::ignoreErrors()
  await this.connectXenServer(id)
}

enable.description = 'enable a Xen server'

enable.permission = 'admin'

enable.params = {
  id: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export async function disable({ id }) {
  this.updateXenServer(id, { enabled: false })::ignoreErrors()
  await this.disconnectXenServer(id)
}

disable.description = 'disable a Xen server'

disable.permission = 'admin'

disable.params = {
  id: {
    type: 'string',
  },
}
