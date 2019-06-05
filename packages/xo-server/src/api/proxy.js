export function register(appliance) {
  return this.registerProxy(appliance)
}

register.permission = 'admin'
register.params = {
  address: {
    type: 'string',
  },
  name: {
    type: 'string',
    optional: true,
  },
  authenticationToken: {
    type: 'string',
  },
}

export async function unregister({ id }) {
  await this.unregisterProxy(id)
}

unregister.permission = 'admin'
unregister.params = {
  id: {
    type: 'string',
  },
}

export function get({ id }) {
  return this.getProxy(id)
}

get.permission = 'admin'
get.params = {
  id: {
    type: 'string',
  },
}

export function getAll() {
  return this.getAllProxies()
}

getAll.permission = 'admin'

export function update({ id, ...props }) {
  return this.updateProxy(id, props)
}

update.permission = 'admin'
update.params = {
  id: {
    type: 'string',
  },
  address: {
    type: 'string',
    optional: true,
  },
  name: {
    type: 'string',
    optional: true,
  },
  authenticationToken: {
    type: 'string',
    optional: true,
  },
}
