export function register({ vm, ...props }) {
  return this.registerProxy({
    vmUuid: vm !== undefined ? this.getObject(vm).uuid : vm,
    ...props,
  })
}

register.permission = 'admin'
register.params = {
  address: {
    type: 'string',
    optional: true,
  },
  vm: {
    type: 'string',
    optional: true,
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

export function destroy({ id }) {
  return this.destroyProxy(id)
}

destroy.permission = 'admin'
destroy.params = {
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

export function update({ id, vm, ...props }) {
  return this.updateProxy(id, {
    vmUuid: vm != null ? this.getObject(vm).uuid : vm,
    ...props,
  })
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
  vm: {
    type: ['string', 'null'],
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

export function deploy({ sr, ...props }) {
  return this.deployProxy(sr._xapiId, props)
}
deploy.params = {
  proxyName: {
    type: 'string',
    optional: true,
  },
  sr: {
    type: 'string',
  },
  xoaName: {
    type: 'string',
    optional: true,
  },
}
deploy.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

export function checkHealth({ id }) {
  return this.callProxyMethod(id, 'system.getServerVersion')
}
checkHealth.permission = 'admin'
checkHealth.params = {
  id: {
    type: 'string',
  },
}
