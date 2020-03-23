export function register({ vm, ...props }) {
  return this.registerProxy({
    vmUuid: vm?.uuid,
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
register.resolve = {
  vm: ['vm', 'VM', 'administrate'],
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
    type: ['string', 'null'],
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

export function deploy({ network, proxy, sr }) {
  return this.deployProxy(sr._xapiId, { network, proxyId: proxy })
}

deploy.permission = 'admin'
deploy.params = {
  sr: {
    type: 'string',
  },
  network: {
    type: 'object',
    optional: true,
    properties: {
      ip: {
        type: 'string',
      },
      netmask: {
        type: 'string',
      },
      gateway: {
        type: 'string',
      },
      dns: {
        type: 'string',
      },
    },
  },
  proxy: {
    type: 'string',
    optional: true,
  },
}
deploy.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

export function upgradeAppliance({ id }) {
  return this.upgradeProxyAppliance(id)
}

upgradeAppliance.permission = 'admin'
upgradeAppliance.params = {
  id: {
    type: 'string',
  },
}

export function checkHealth({ id }) {
  return this.checkProxyHealth(id)
}
checkHealth.permission = 'admin'
checkHealth.params = {
  id: {
    type: 'string',
  },
}
