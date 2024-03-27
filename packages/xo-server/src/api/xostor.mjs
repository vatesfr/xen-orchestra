import { asyncEach } from '@vates/async-each'
import { defer } from 'golike-defer'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

const ENUM_PROVISIONING = {
  Thin: 'thin',
  Thick: 'thick',
}
const LV_NAME = 'thin_device'
const PROVISIONING = Object.values(ENUM_PROVISIONING)
const VG_NAME = 'linstor_group'
const XOSTOR_DEPENDENCIES = ['xcp-ng-release-linstor', 'xcp-ng-linstor']

function checkIfLinstorSr(sr) {
  if (sr.SR_type !== 'linstor') {
    throw new Error('Not a XOSTOR storage')
  }
}

function pluginCall(xapi, host, plugin, fnName, args) {
  return Task.run(
    { properties: { name: `call plugin on: ${host.name_label}`, objectId: host.uuid, plugin, fnName, args } },
    () => xapi.call('host.call_plugin', host._xapiRef, plugin, fnName, args)
  )
}

async function destroyVolumeGroup(xapi, host, force) {
  return Task.run(
    { properties: { name: `destroy volume group on ${host.name_label}`, objectId: host.uuid, vgName: VG_NAME } },
    () =>
      pluginCall(xapi, host, 'lvm.py', 'destroy_volume_group', {
        vg_name: VG_NAME,
        force: String(force),
      })
  )
}

async function installOrUpdateDependencies(host, method = 'install') {
  return Task.run(
    {
      properties: {
        dependencies: XOSTOR_DEPENDENCIES,
        name: `${method} XOSTOR dependencies on ${host.name_label}`,
        objectId: host.uuid,
      },
    },
    async () => {
      if (method !== 'install' && method !== 'update') {
        throw new Error('Invalid method')
      }

      const xapi = this.getXapi(host)
      for (const _package of XOSTOR_DEPENDENCIES) {
        await pluginCall(xapi, host, 'updater.py', method, {
          packages: _package,
        })
      }
    }
  )
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
  return Task.run(
    { properties: { disks, name: `format disks on ${host.name_label}`, objectId: host.uuid } },
    async () => {
      const xapi = this.getXapi(host)

      const lvmPlugin = (fnName, args) => pluginCall(xapi, host, 'lvm.py', fnName, args)

      if (force) {
        await destroyVolumeGroup(xapi, host, force)
      }

      // ATM we are unable to correctly identify errors (error.code can be used for multiple errors.)
      // so we are just adding some suggestion of "why there is this error"
      // Error handling will be improved as errors are discovered and understood
      try {
        await lvmPlugin('create_physical_volume', {
          devices: rawDisks,
          ignore_existing_filesystems: String(ignoreFileSystems),
          force: String(force),
        })
      } catch (error) {
        if (error.code === 'LVM_ERROR(5)') {
          error.params = error.params.concat([
            "[XO] This error can be triggered if one of the disks is a 'tapdevs' disk.",
            '[XO] This error can be triggered if at least one the disks has children.',
            '[XO] This error can be triggered if at least one the disks has a file system.',
          ])
        }
        throw error
      }
      try {
        await lvmPlugin('create_volume_group', {
          devices: rawDisks,
          vg_name: VG_NAME,
        })
      } catch (error) {
        if (error.code === 'LVM_ERROR(5)') {
          error.params = error.params.concat([
            "[XO] This error can be triggered if a VG 'linstor_group' is already present on the host.",
          ])
        }
        throw error
      }

      if (provisioning === ENUM_PROVISIONING.Thin) {
        await lvmPlugin('create_thin_pool', {
          lv_name: LV_NAME,
          vg_name: VG_NAME,
        })
      }
    }
  )
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

export const create = defer(async function (
  $defer,
  { description, disksByHost, force, ignoreFileSystems, name, preferredInterface, provisioning, replication }
) {
  let network
  if (preferredInterface !== undefined) {
    network = this.getObject(preferredInterface.networkId)
    await this.checkPermissions([[preferredInterface.networkId, 'operate']])
  }

  const task = await this.tasks.create({ name: `creation of XOSTOR: ${name}`, type: 'xo:xostor:create' })
  return task.run(async () => {
    const hostIds = Object.keys(disksByHost)

    const tmpBoundObjectId = `tmp_${hostIds.join(',')}_${Math.random().toString(32).slice(2)}`

    const license = await Task.run({ properties: { name: 'license check' } }, async () => {
      const xostorLicenses = await this.getLicenses({ productType: 'xostor' })

      const now = Date.now()
      const availableLicenses = xostorLicenses.filter(
        ({ boundObjectId, expires }) => boundObjectId === undefined && (expires === undefined || expires > now)
      )

      let _license = availableLicenses.find(({ productId }) => productId === 'xostor')

      if (_license === undefined) {
        _license = availableLicenses.find(({ productId }) => productId === 'xostor.trial')
      }

      if (_license === undefined) {
        _license = await this.createBoundXostorTrialLicense({
          boundObjectId: tmpBoundObjectId,
        })
      } else {
        await this.bindLicense({
          licenseId: _license.id,
          boundObjectId: tmpBoundObjectId,
        })
      }
      $defer.onFailure(() =>
        this.unbindLicense({
          licenseId: _license.id,
          productId: _license.productId,
          boundObjectId: tmpBoundObjectId,
        })
      )

      return _license
    })

    const hosts = hostIds.map(hostId => this.getObject(hostId, 'host'))
    if (!hosts.every(host => host.$pool === hosts[0].$pool)) {
      // we need to do this test to ensure it won't create a partial LV group with only the host of the pool of the first master
      throw new Error('All hosts must be in the same pool')
    }

    const boundInstallDependencies = installDependencies.bind(this)
    await asyncEach(hosts, host => boundInstallDependencies({ host }), { stopOnError: false })

    const host = hosts[0]
    const xapi = this.getXapi(host)

    const boundFormatDisks = formatDisks.bind(this)
    await asyncEach(
      hosts,
      async host => {
        await boundFormatDisks({ disks: disksByHost[host.id], host, force, ignoreFileSystems, provisioning })
        $defer.onFailure(() => destroyVolumeGroup(xapi, host, true))
      },
      {
        stopOnError: false,
      }
    )

    const srRef = await Task.run({ properties: { name: 'creation of the storage' } }, () =>
      xapi.SR_create({
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
    )
    $defer.onFailure(() => xapi.destroySr(srRef))
    const srUuid = await xapi.getField('SR', srRef, 'uuid')

    if (network !== undefined) {
      await Task.run({ properties: { name: 'configure linstor interface' } }, async () => {
        await xapi.xostor_createInterface(srRef, network._xapiRef, preferredInterface.name)
        await xapi.xostor_setPreferredInterface(srRef, preferredInterface.name)
      })
    }

    await this.rebindLicense({
      licenseId: license.id,
      oldBoundObjectId: tmpBoundObjectId,
      newBoundObjectId: srUuid,
    })

    return srUuid
  })
})

create.description = 'Create a XOSTOR storage'
create.permission = 'admin'
create.params = {
  description: { type: 'string', optional: true, default: 'From XO-server' },
  disksByHost: { type: 'object' },
  force: { type: 'boolean', optional: true, default: false },
  ignoreFileSystems: { type: 'boolean', optional: true, default: false },
  name: { type: 'string' },
  preferredInterface: {
    optional: true,
    properties: {
      networkId: { type: 'string' },
      name: { type: 'string' },
    },
    type: 'object',
  },
  provisioning: { enum: PROVISIONING },
  replication: { type: 'number' },
}

// Also called by sr.destroy if sr.SR_type === 'linstor'
export async function destroy({ sr }) {
  const task = this.tasks.create({
    name: `deletion of XOSTOR: ${sr.name_label}`,
    objectId: sr.uuid,
    type: 'xo:xostor:destroy',
  })
  return task.run(async () => {
    checkIfLinstorSr(sr)
    const xapi = this.getXapi(sr)
    const hosts = Object.values(xapi.objects.indexes.type.host).map(host => this.getObject(host.uuid, 'host'))

    await Task.run({ properties: { name: 'deletion of the storage', objectId: sr.uuid } }, () =>
      xapi.destroySr(sr._xapiId)
    )
    const license = (await this.getLicenses({ productType: 'xostor' })).find(
      license => license.boundObjectId === sr.uuid
    )
    await Task.run({ properties: { name: 'unbind the attached license' } }, () =>
      this.unbindLicense({
        boundObjectId: license.boundObjectId,
        productId: license.productId,
      })
    )
    await Task.run({ properties: { name: `destroy volume group on ${hosts.length} hosts` } }, () =>
      asyncEach(hosts, host => destroyVolumeGroup(xapi, host, true), { stopOnError: false })
    )
  })
}
destroy.description = 'Destroy a XOSTOR storage'
destroy.permission = 'admin'
destroy.params = {
  sr: { type: 'string' },
}
destroy.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

export async function set({ sr, preferredInterface }) {
  checkIfLinstorSr(sr)
  if (preferredInterface !== undefined) {
    await this.getXapi(sr).xostor_setPreferredInterface(sr._xapiRef, preferredInterface)
  }
}
set.description = 'Changes the properties of an existing XOSTOR storage'
set.params = {
  sr: { type: 'string' },
  preferredInterface: {
    optional: true,
    type: 'string',
  },
}
set.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

export async function createInterface({ sr, network, name }) {
  checkIfLinstorSr(sr)
  await this.getXapi(sr).xostor_createInterface(sr._xapiRef, network._xapiRef, name)
}
createInterface.description = 'Create a linstor interface'
createInterface.params = {
  sr: { type: 'string' },
  network: { type: 'string' },
  name: { type: 'string' },
}
createInterface.resolve = {
  sr: ['sr', 'SR', 'administrate'],
  network: ['network', 'network', 'operate'],
}

export async function getInterfaces({ sr }) {
  checkIfLinstorSr(sr)
  return this.getXapi(sr).xostor_getInterfaces(sr._xapiRef)
}
getInterfaces.description = 'Get linstor available interfaces'
getInterfaces.params = {
  sr: { type: 'string' },
}
getInterfaces.resolve = {
  sr: ['sr', 'SR', 'view'],
}

export async function destroyInterface({ sr, name }) {
  checkIfLinstorSr(sr)
  await this.getXapi(sr).xostor_destroyInterface(sr._xapiRef, name)
}
destroyInterface.description = 'Destroy a linstor interface'
destroyInterface.params = {
  sr: { type: 'string' },
  name: { type: 'string' },
}
destroyInterface.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}
