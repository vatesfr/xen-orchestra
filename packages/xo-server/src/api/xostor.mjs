import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

const ENUM_PROVISIONING = {
  Thin: 'thin',
  Thick: 'thick',
}
const LV_NAME = 'thin_device'
const PROVISIONING = Object.values(ENUM_PROVISIONING)
const VG_NAME = 'linstor_group'
const _XOSTOR_DEPENDENCIES = ['xcp-ng-release-linstor', 'xcp-ng-linstor']
const XOSTOR_DEPENDENCIES = _XOSTOR_DEPENDENCIES.join(',')

const log = createLogger('xo:api:pool')

function pluginCall(xapi, host, plugin, fnName, args) {
  return xapi.call('host.call_plugin', host._xapiRef, plugin, fnName, args)
}

async function destroyVolumeGroup(xapi, host, force) {
  log.info(`Trying to delete the ${VG_NAME} volume group.`, { hostId: host.id })
  return pluginCall(xapi, host, 'lvm.py', 'destroy_volume_group', {
    vg_name: VG_NAME,
    force: String(force),
  })
}

async function installOrUpdateDependencies(host, method = 'install') {
  if (method !== 'install' && method !== 'update') {
    throw new Error('Invalid method')
  }

  const xapi = this.getXapi(host)
  log.info(`Trying to ${method} XOSTOR dependencies (${XOSTOR_DEPENDENCIES})`, { hostId: host.id })
  for (const _package of _XOSTOR_DEPENDENCIES) {
    await pluginCall(xapi, host, 'updater.py', method, {
      packages: _package,
    })
  }
}

export function installDependencies({ host }) {
  return installOrUpdateDependencies.call(this, host)
}
installDependencies.description = 'Install XOSTOR dependencies'
installDependencies.permission = 'admin'
installDependencies.params = {
  host: { type: 'string' },
}
installDependencies.resolve = {
  host: ['host', 'host', 'administrate'],
}

export function updateDependencies({ host }) {
  return installOrUpdateDependencies.call(this, host, 'update')
}
updateDependencies.description = 'Update XOSTOR dependencies'
updateDependencies.permission = 'admin'
updateDependencies.params = {
  host: { type: 'string' },
}
updateDependencies.resolve = {
  host: ['host', 'host', 'administrate'],
}

export async function formatDisks({ disks, force, host, ignoreFileSystems, provisioning }) {
  const rawDisks = disks.join(',')
  const xapi = this.getXapi(host)

  const lvmPlugin = (fnName, args) => pluginCall(xapi, host, 'lvm.py', fnName, args)
  log.info(`Format disks (${rawDisks}) with force: ${force}`, { hostId: host.id })

  if (force) {
    await destroyVolumeGroup(xapi, host, force)
  }
  await lvmPlugin('create_physical_volume', {
    devices: rawDisks,
    ignore_existing_filesystems: String(ignoreFileSystems),
    force: String(force),
  })

  await lvmPlugin('create_volume_group', {
    devices: rawDisks,
    vg_name: VG_NAME,
  })

  if (provisioning === ENUM_PROVISIONING.Thin) {
    await lvmPlugin('create_thin_pool', {
      lv_name: LV_NAME,
      vg_name: VG_NAME,
    })
  }
}
formatDisks.description = 'Format disks for a XOSTOR use'
formatDisks.permission = 'admin'
formatDisks.params = {
  disks: { type: 'array', items: { type: 'string' } },
  force: { type: 'boolean', optional: true, default: false },
  host: { type: 'string' },
  ignoreFileSystems: { type: 'boolean', optional: true, default: false },
  provisioning: { enum: PROVISIONING },
}
formatDisks.resolve = {
  host: ['host', 'host', 'administrate'],
}

export async function create({ description, disksByHosts, force, ignoreFileSystems, name, provisioning, replication }) {
  const hostIds = Object.keys(disksByHosts)
  const hosts = hostIds.map(hostId => this.getObject(hostId, 'host'))

  if (!hosts.every(host => host.$pool === hosts[0].$pool)) {
    // we need to do this test to ensure it won't create a partial LV group with only the host of the pool of the first master
    throw new Error('All hosts must be in the same pool')
  }

  const boundInstallDependencies = installDependencies.bind(this)
  await asyncEach(hosts, host => boundInstallDependencies({ host }), { stopOnError: false })
  const boundFormatDisks = formatDisks.bind(this)
  await asyncEach(
    hosts,
    host => boundFormatDisks({ disks: disksByHosts[host.id], host, force, ignoreFileSystems, provisioning }),
    {
      stopOnError: false,
    },
  )

  const host = hosts[0]

  log.info(`Create XOSTOR (${name}) with provisioning: ${provisioning}`)
  return this.getXapi(host).SR_create({
    device_config: {
      'group-name': 'linstor_group/' + LV_NAME,
      redundancy: String(replication),
      provisioning,
    },
    host: host.id,
    name_description: description,
    name_label: name,
    shared: true,
    type: 'linstor',
  })
}
create.description = 'Create a XOSTOR storage'
create.permission = 'admin'
create.params = {
  description: { type: 'string', optional: true, default: 'From XO-server' },
  disksByHosts: { type: 'object' },
  force: { type: 'boolean', optional: true, default: false },
  ignoreFileSystems: { type: 'boolean', optional: true, default: false },
  name: { type: 'string' },
  provisioning: { enum: PROVISIONING },
  replication: { type: 'number' },
}

// Also called by sr.destroy if sr.SR_type === 'linstor'
export async function destroy({ sr }) {
  if (sr.SR_type !== 'linstor') {
    throw new Error('Not a XOSTOR storage')
  }
  const xapi = this.getXapi(sr)
  const hosts = Object.values(xapi.objects.indexes.type.host).map(host => this.getObject(host.uuid, 'host'))

  await xapi.destroySr(sr._xapiId)
  return asyncEach(hosts, host => destroyVolumeGroup(xapi, host, true), { stopOnError: false })
}
destroy.description = 'Destroy a XOSTOR storage'
destroy.permission = 'admin'
destroy.params = {
  sr: { type: 'string' },
}
destroy.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}
