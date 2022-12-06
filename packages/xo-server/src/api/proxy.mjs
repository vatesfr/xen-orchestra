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
  vmUuid: {
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

export function deploy({ license, network, proxy, sr, ...props }) {
  return this.deployProxy(sr._xapiId, license, {
    networkId: network?._xapiId,
    proxyId: proxy,
    ...props,
  })
}

deploy.permission = 'admin'
deploy.params = {
  httpProxy: {
    type: 'string',
    optional: true,
  },
  license: {
    type: 'string',
  },
  sr: {
    type: 'string',
  },
  network: {
    type: 'string',
    optional: true,
  },
  networkConfiguration: {
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
  network: ['network', 'network', 'administrate'],
  sr: ['sr', 'SR', 'administrate'],
}

export function upgradeAppliance({ id, ignoreRunningJobs }) {
  return this.upgradeProxyAppliance(id, ignoreRunningJobs)
}

upgradeAppliance.permission = 'admin'
upgradeAppliance.params = {
  id: {
    type: 'string',
  },
  ignoreRunningJobs: {
    type: 'boolean',
    optional: true,
  },
}

export function getApplianceUpdaterState({ id }) {
  return this.getProxyApplianceUpdaterState(id)
}

getApplianceUpdaterState.permission = 'admin'
getApplianceUpdaterState.params = {
  id: {
    type: 'string',
  },
}

export async function checkHealth({ id }) {
  try {
    await this.callProxyMethod(id, 'system.getServerVersion')
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    }
  }
}
checkHealth.permission = 'admin'
checkHealth.params = {
  id: {
    type: 'string',
  },
}

export function updateApplianceSettings({ id, ...props }) {
  return this.updateProxyAppliance(id, props)
}

updateApplianceSettings.permission = 'admin'
updateApplianceSettings.params = {
  id: {
    type: 'string',
  },
  httpProxy: {
    type: ['string', 'null'],
    optional: true,
  },
}
