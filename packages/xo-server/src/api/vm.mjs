import * as multiparty from 'multiparty'
import * as xoData from '@xen-orchestra/xapi/xoData.mjs'
import assignWith from 'lodash/assignWith.js'
import TTLCache from '@isaacs/ttlcache'
import { asyncEach } from '@vates/async-each'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import concat from 'lodash/concat.js'
import hrp from 'http-request-plus'
import mapKeys from 'lodash/mapKeys.js'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { format } from 'json-rpc-peer'
import { FAIL_ON_QUEUE } from 'limit-concurrency-decorator'
import { getStreamAsBuffer } from 'get-stream'
import { ignoreErrors, timeout } from 'promise-toolbox'
import { invalidParameters, noSuchObject, unauthorized } from 'xo-common/api-errors.js'
import { Ref } from 'xen-api'

import { forEach, map, mapFilter, noop, parseSize, safeDateFormat } from '../utils.mjs'

const log = createLogger('xo:vm')

const RESTART_OPERATIONS = ['reboot', 'clean_reboot', 'hard_reboot']
const SHUTDOWN_OPERATIONS = ['shutdown', 'clean_shutdown', 'hard_shutdown']

const TTL_CACHE = 3e4
const CACHE = new TTLCache({
  ttl: TTL_CACHE,
})

// ===================================================================

export function getHaValues() {
  return ['best-effort', 'restart', '']
}

function checkPermissionOnSrs(vm, permission = 'operate') {
  const permissions = []
  forEach(vm.$VBDs, vbdId => {
    const vbd = this.getObject(vbdId, 'VBD')
    const vdiId = vbd.VDI

    if (vbd.is_cd_drive || !vdiId) {
      return
    }
    return permissions.push([this.getObject(vdiId, ['VDI', 'VDI-snapshot']).$SR, permission])
  })

  return this.checkPermissions(permissions)
}

// ===================================================================

const extract = (obj, prop) => {
  const value = obj[prop]
  delete obj[prop]
  return value
}

const startVmAndDestroyCloudConfigVdi = async (xapi, vm, vdiUuid, params) => {
  try {
    const timeLimit = Date.now() + 10 * 60 * 1000
    await xapi.startVm(vm.uuid)

    if (params.destroyCloudConfigVdiAfterBoot && vdiUuid !== undefined) {
      await xapi.VDI_destroyCloudInitConfig(xapi.getObject(vdiUuid).$ref, { timeLimit })
    }
  } catch (error) {
    log.warn('startVmAndDestroyCloudConfigVdi', { error, vdi: { uuid: vdiUuid }, vm: { uuid: vm.uuid } })
  }
}

// TODO: Implement ACLs
export const create = defer(async function ($defer, params) {
  const { user } = this.apiContext
  const resourceSet = extract(params, 'resourceSet')
  const template = extract(params, 'template')
  if (resourceSet === undefined) {
    await this.checkPermissions([[template.$pool, 'administrate']])
  }

  params.template = template._xapiId

  const xapi = this.getXapi(template)

  const objectIds = [template.id]
  const limits = {
    cpus: template.CPUs.number,
    disk: 0,
    memory: template.memory.dynamic[1],
    vms: 1,
  }
  const vdiSizesByDevice = {}
  let highestDevice = -1
  forEach(xapi.getObject(template._xapiId).$VBDs, vbd => {
    let vdi
    highestDevice = Math.max(highestDevice, vbd.userdevice)
    if (vbd.type === 'Disk' && (vdi = vbd.$VDI)) {
      vdiSizesByDevice[vbd.userdevice] = +vdi.virtual_size
    }
  })

  const vdis = extract(params, 'VDIs')
  params.vdis =
    vdis &&
    map(vdis, vdi => {
      const sr = this.getObject(vdi.SR)
      const size = parseSize(vdi.size)

      objectIds.push(sr.id)
      limits.disk += size

      return {
        ...vdi,
        device: ++highestDevice,
        size,
        SR: sr._xapiId,
        type: vdi.type,
      }
    })

  const existingVdis = extract(params, 'existingDisks')
  params.existingVdis =
    existingVdis &&
    map(existingVdis, (vdi, userdevice) => {
      let size, sr
      if (vdi.size != null) {
        size = parseSize(vdi.size)
        vdiSizesByDevice[userdevice] = size
      }

      if (vdi.$SR) {
        sr = this.getObject(vdi.$SR)
        objectIds.push(sr.id)
      }

      return {
        ...vdi,
        size,
        $SR: sr && sr._xapiId,
      }
    })

  forEach(vdiSizesByDevice, size => (limits.disk += size))

  const vifs = extract(params, 'VIFs')
  params.vifs =
    vifs &&
    map(vifs, vif => {
      const network = this.getObject(vif.network)

      objectIds.push(network.id)

      return {
        mac: vif.mac,
        network: network._xapiId,
        ipv4_allowed: vif.allowedIpv4Addresses,
        ipv6_allowed: vif.allowedIpv6Addresses,
      }
    })

  const installation = extract(params, 'installation')
  params.installRepository = installation && installation.repository

  let checkLimits

  if (resourceSet) {
    await this.checkResourceSetConstraints(resourceSet, user.id, objectIds)
    checkLimits = async limits2 => {
      const _limits = assignWith({}, limits, limits2, (l1 = 0, l2) => l1 + l2)
      await this.allocateLimitsInResourceSet(_limits, resourceSet)
      $defer.onFailure(() => this.releaseLimitsInResourceSet(_limits, resourceSet))
    }
  }

  const resourceSetTags = resourceSet !== undefined ? (await this.getResourceSet(resourceSet)).tags : undefined
  const paramsTags = params.tags
  if (resourceSetTags !== undefined) {
    params.tags = paramsTags !== undefined ? paramsTags.concat(resourceSetTags) : resourceSetTags
  }

  const xapiVm = await xapi.createVm(template._xapiId, params, checkLimits, user.id, { destroyAllVifs: true })
  $defer.onFailure(() => xapi.VM_destroy(xapiVm.$ref, { deleteDisks: true, force: true }))

  const vm = xapi.xo.addObject(xapiVm)

  // create cloud config drive
  let cloudConfigVdiUuid
  if (params.cloudConfig != null) {
    cloudConfigVdiUuid = await xapi.VM_createCloudInitConfig(vm._xapiRef, params.cloudConfig, {
      networkConfig: params.networkConfig,
    })
  }

  if (resourceSet) {
    await Promise.all([
      params.share
        ? Promise.all(
            map((await this.getResourceSet(resourceSet)).subjects, subjectId => this.addAcl(subjectId, vm.id, 'admin'))
          )
        : this.addAcl(user.id, vm.id, 'admin'),
      xapi.xo.setData(xapiVm.$id, 'resourceSet', resourceSet),
    ])
  }

  for (const vif of xapiVm.$VIFs) {
    xapi.xo.addObject(vif)
    await this.allocIpAddresses(vif.$id, concat(vif.ipv4_allowed, vif.ipv6_allowed)).catch(() => xapi.deleteVif(vif))
  }

  if (params.createVtpm) {
    const vtpmRef = await xapi.VTPM_create({ VM: xapiVm.$ref })
    $defer.onFailure(() => xapi.call('VTPM.destroy', vtpmRef))
  }

  if (params.bootAfterCreate) {
    startVmAndDestroyCloudConfigVdi(xapi, xapiVm, cloudConfigVdiUuid, params)
  }

  return vm.id
})

create.params = {
  affinityHost: { type: 'string', optional: true },

  bootAfterCreate: {
    type: 'boolean',
    optional: true,
  },

  cloudConfig: {
    type: 'string',
    optional: true,
  },

  createVtpm: {
    type: 'boolean',
    default: false,
  },

  networkConfig: {
    type: 'string',
    optional: true,
  },

  coreOs: {
    type: 'boolean',
    optional: true,
  },

  clone: {
    type: 'boolean',
    optional: true,
  },

  coresPerSocket: {
    type: ['string', 'number'],
    optional: true,
  },

  resourceSet: {
    type: 'string',
    optional: true,
  },

  destroyCloudConfigVdiAfterBoot: {
    type: 'boolean',
    optional: true,
  },

  installation: {
    type: 'object',
    optional: true,
    properties: {
      method: { type: 'string' },
      repository: { type: 'string' },
    },
  },

  vgpuType: {
    type: 'string',
    optional: true,
  },

  gpuGroup: {
    type: 'string',
    optional: true,
  },

  // Name/description of the new VM.
  name_label: { type: 'string' },
  name_description: { type: 'string', minLength: 0, optional: true },

  // PV Args
  pv_args: { type: 'string', optional: true },

  share: {
    type: 'boolean',
    optional: true,
  },

  // TODO: add the install repository!
  // VBD.insert/eject
  // Also for the console!

  // UUID of the template the VM will be created from.
  template: { type: 'string' },

  // Virtual interfaces to create for the new VM.
  VIFs: {
    optional: true,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        // UUID of the network to create the interface in.
        network: { type: 'string' },

        mac: {
          optional: true, // Auto-generated per default.
          type: 'string',
        },

        allowedIpv4Addresses: {
          optional: true,
          type: 'array',
          items: { type: 'string' },
        },

        allowedIpv6Addresses: {
          optional: true,
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },

  // Virtual disks to create for the new VM.
  VDIs: {
    optional: true, // If not defined, use the template parameters.
    type: 'array',
    items: {
      type: 'object',
      properties: {
        size: { type: ['integer', 'string'] },
        SR: { type: 'string' },
        type: { type: 'string' },
      },
      additionalProperties: true,
    },
  },

  // TODO: rename to *existingVdis* or rename *VDIs* to *disks*.
  existingDisks: {
    optional: true,
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        size: {
          type: ['integer', 'string'],
          optional: true,
        },
        $SR: {
          type: 'string',
          optional: true,
        },
      },
      additionalProperties: true,
    },
  },

  hvmBootFirmware: { type: 'string', optional: true },

  copyHostBiosStrings: { type: 'boolean', optional: true },

  // other params are passed to `editVm`
  '*': {},
}

create.resolve = {
  template: ['template', 'VM-template', ''],
  vgpuType: ['vgpuType', 'vgpuType', ''],
  gpuGroup: ['gpuGroup', 'gpuGroup', ''],
}

// -------------------------------------------------------------------

const delete_ = defer(async function (
  $defer,
  {
    delete_disks, // eslint-disable-line camelcase
    force,
    forceDeleteDefaultTemplate,
    forceBlockedOperation,
    vm,

    deleteDisks = delete_disks,
  }
) {
  const xapi = this.getXapi(vm)

  this.getAllAcls().then(acls => {
    return Promise.all(
      mapFilter(acls, acl => {
        if (acl.object === vm.id) {
          return ignoreErrors.call(this.removeAcl(acl.subject, acl.object, acl.action))
        }
      })
    )
  })

  // Update IP pools
  await Promise.all(
    map(vm.VIFs, vifId => {
      const vif = xapi.getObject(vifId)
      return ignoreErrors.call(this.allocIpAddresses(vifId, null, concat(vif.ipv4_allowed, vif.ipv6_allowed)))
    })
  )

  // Update resource sets
  let resourceSet
  if (
    (vm.type === 'VM' || vm.type === 'VM-snapshot') &&
    (resourceSet = xapi.xo.getData(vm._xapiId, 'resourceSet')) != null
  ) {
    await this.setVmResourceSet(vm._xapiId, null)::ignoreErrors()
    $defer.onFailure(() => this.setVmResourceSet(vm._xapiId, resourceSet, true)::ignoreErrors())
  }

  await asyncMapSettled(vm.snapshots, async id => {
    const { resourceSet } = this.getObject(id)
    if (resourceSet !== undefined) {
      await this.setVmResourceSet(id, null)
      $defer.onFailure(() => this.setVmResourceSet(id, resourceSet, true))
    }
  })

  return xapi.VM_destroy(vm._xapiRef, {
    deleteDisks,
    force,
    forceDeleteDefaultTemplate,
    bypassBlockedOperation: forceBlockedOperation,
  })
})

delete_.params = {
  id: { type: 'string' },

  deleteDisks: {
    optional: true,
    type: 'boolean',
  },

  force: {
    optional: true,
    type: 'boolean',
  },

  forceDeleteDefaultTemplate: {
    optional: true,
    type: 'boolean',
  },

  forceBlockedOperation: {
    optional: true,
    type: 'boolean',
  },
}
delete_.resolve = {
  vm: ['id', ['VM', 'VM-snapshot', 'VM-template'], 'administrate'],
}

export { delete_ as delete }

// -------------------------------------------------------------------

export async function ejectCd({ vm }) {
  await this.getXapi(vm).ejectCdFromVm(vm._xapiId)
}

ejectCd.params = {
  id: { type: 'string' },
}

ejectCd.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export async function insertCd({ vm, vdi, force = true }) {
  await this.getXapi(vm).insertCdIntoVm(vdi._xapiId, vm._xapiId, { force })
}

insertCd.params = {
  id: { type: 'string' },
  cd_id: { type: 'string' },
  force: { type: 'boolean', optional: true },
}

insertCd.resolve = {
  vm: ['id', 'VM', 'operate'],
  // Not compatible with resource sets.
  // FIXME: find a workaround.
  vdi: ['cd_id', 'VDI', ''],
}

// -------------------------------------------------------------------
export function getSecurebootReadiness({ vm, forceRefresh }) {
  const xapi = this.getXapi(vm)
  const vmRef = vm._xapiRef
  const xapiMethodName = 'VM.get_secureboot_readiness'

  if (forceRefresh) {
    CACHE.delete(xapi.computeCacheKey(xapiMethodName, vmRef))
  }

  return xapi.call(CACHE, xapiMethodName, vmRef)
}

getSecurebootReadiness.params = {
  id: { type: 'string' },
  forceRefresh: { type: 'boolean', default: false },
}

getSecurebootReadiness.resolve = {
  vm: ['id', 'VM', 'view'],
}

// -------------------------------------------------------------------

export async function migrate({
  bypassAssert = false,
  force,
  host,
  mapVdisSrs,
  mapVifsNetworks,
  migrationNetwork,
  sr,
  vm,
}) {
  let mapVdisSrsXapi, mapVifsNetworksXapi
  const permissions = []

  if (mapVdisSrs) {
    mapVdisSrsXapi = {}
    forEach(mapVdisSrs, (srId, vdiId) => {
      const vdiXapiId = this.getObject(vdiId, 'VDI')._xapiId
      mapVdisSrsXapi[vdiXapiId] = this.getObject(srId, 'SR')._xapiId
      return permissions.push([srId, 'administrate'])
    })
  }

  if (mapVifsNetworks) {
    mapVifsNetworksXapi = {}
    forEach(mapVifsNetworks, (networkId, vifId) => {
      const vifXapiId = this.getObject(vifId, 'VIF')._xapiId
      mapVifsNetworksXapi[vifXapiId] = this.getObject(networkId, 'network')._xapiId
      return permissions.push([networkId, 'administrate'])
    })
  }

  await this.checkPermissions(permissions)

  await this.getXapi(vm).migrateVm(vm._xapiId, this.getXapi(host), host._xapiId, {
    sr: sr && this.getObject(sr, 'SR')._xapiId,
    migrationNetworkId: migrationNetwork != null ? migrationNetwork._xapiId : undefined,
    mapVifsNetworks: mapVifsNetworksXapi,
    mapVdisSrs: mapVdisSrsXapi,
    force,
    bypassAssert,
  })
}

migrate.params = {
  // Identifier of the VM to migrate.
  vm: { type: 'string' },

  force: { type: 'boolean', optional: true },

  // Identifier of the host to migrate to.
  targetHost: { type: 'string' },

  // Identifier of the default SR to migrate to.
  sr: { type: 'string', optional: true },

  // Map VDIs IDs --> SRs IDs
  mapVdisSrs: { type: 'object', optional: true },

  // Map VIFs IDs --> Networks IDs
  mapVifsNetworks: { type: 'object', optional: true },

  // Identifier of the Network use for the migration
  migrationNetwork: { type: 'string', optional: true },

  bypassAssert: {
    description: 'Bypass the verification asserting whether a VM can be migrated to the specified destination',
    optional: true,
    type: 'boolean',
  },
}

migrate.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  host: ['targetHost', 'host', 'administrate'],
  migrationNetwork: ['migrationNetwork', 'network', 'administrate'],
}

export async function warmMigration({ vm, sr, startDestinationVm, deleteSourceVm }) {
  await this.warmMigrateVm(vm, sr, startDestinationVm, deleteSourceVm)
}
warmMigration.permission = 'admin'

warmMigration.params = {
  vm: {
    type: 'string',
  },
  sr: {
    type: 'string',
  },
  startDestinationVm: { type: 'boolean' },
  deleteSourceVm: { type: 'boolean' },
}

// -------------------------------------------------------------------

const autoPrefix = (pfx, str) => (str.startsWith(pfx) ? str : pfx + str)

export const set = defer(async function ($defer, params) {
  const VM = extract(params, 'VM')
  const xapi = this.getXapi(VM)
  const vmId = VM._xapiId

  const resourceSetId = extract(params, 'resourceSet')
  if (resourceSetId !== undefined) {
    if (this.apiContext.permission !== 'admin') {
      throw unauthorized()
    }

    await this.setVmResourceSet(vmId, resourceSetId, true)
  } else {
    // share is implicit in the other branch with `setVmResourceSet`
    const share = extract(params, 'share')
    if (share) {
      await this.shareVmResourceSet(vmId)
    }
  }

  const suspendSr = extract(params, 'suspendSr')
  if (suspendSr !== undefined) {
    await xapi.call('VM.set_suspend_SR', VM._xapiRef, suspendSr === null ? Ref.EMPTY : suspendSr._xapiRef)
  }

  const xenStoreData = extract(params, 'xenStoreData')
  if (xenStoreData !== undefined) {
    await this.getXapiObject(VM).update_xenstore_data(mapKeys(xenStoreData, (v, k) => autoPrefix('vm-data/', k)))
  }

  const creation = extract(params, 'creation')
  if (creation !== undefined) {
    const xapiVm = await this.getXapiObject(VM)
    await xoData.set(xapiVm, { creation: { ...VM.creation, ...creation } })
  }
  const uefiMode = extract(params, 'uefiMode')
  if (uefiMode !== undefined) {
    await xapi.call('VM.set_uefi_mode', VM._xapiRef, uefiMode)
  }

  return xapi.editVm(vmId, params, async (limits, vm) => {
    const resourceSet = xapi.xo.getData(vm, 'resourceSet')

    if (resourceSet) {
      try {
        await this.allocateLimitsInResourceSet(limits, resourceSet)
        $defer.onFailure(() => this.releaseLimitsInResourceSet(limits, resourceSet))
        return
      } catch (error) {
        // if the resource set no longer exist, behave as if the VM is free
        if (!noSuchObject.is(error)) {
          throw error
        }
      }
    }

    if (limits.cpuWeight && this.apiContext.permission !== 'admin') {
      throw unauthorized()
    }
  })
})

set.params = {
  // Identifier of the VM to update.
  id: { type: 'string' },

  auto_poweron: { type: 'boolean', optional: true },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', minLength: 0, optional: true },

  notes: { type: ['string', 'null'], maxLength: 2048, optional: true },

  high_availability: {
    optional: true,
    enum: getHaValues(),
  },

  // Number of virtual CPUs to allocate.
  CPUs: { type: 'integer', optional: true },

  cpusMax: { type: ['integer', 'string'], optional: true },

  // Memory to allocate (in bytes).
  //
  // Note: static_min ≤ dynamic_min ≤ dynamic_max ≤ static_max
  memory: { type: ['integer', 'string'], optional: true },

  // Set dynamic_min
  memoryMin: { type: ['integer', 'string'], optional: true },

  // Set dynamic_max
  memoryMax: { type: ['integer', 'string'], optional: true },

  // Set static_max
  memoryStaticMax: { type: ['integer', 'string'], optional: true },

  // Kernel arguments for PV VM.
  PV_args: { type: 'string', optional: true },

  cpuMask: { type: 'array', optional: true },

  cpuWeight: { type: ['integer', 'null'], optional: true },

  cpuCap: { type: ['integer', 'null'], optional: true },

  affinityHost: { type: ['string', 'null'], optional: true },

  // Switch from Cirrus video adaptor to VGA adaptor
  vga: { type: 'string', optional: true },

  videoram: { type: 'number', optional: true },

  coresPerSocket: { type: ['string', 'number', 'null'], optional: true },

  // Emulate HVM C000 PCI device for Windows Update to fetch or update PV drivers
  hasVendorDevice: { type: 'boolean', optional: true },

  expNestedHvm: { type: 'boolean', optional: true },

  // Move the vm In to/Out of Self Service
  resourceSet: { type: ['string', 'null'], optional: true },

  share: { type: 'boolean', optional: true },

  startDelay: { type: 'integer', optional: true },

  secureBoot: { type: 'boolean', optional: true },

  // set the VM network interface controller
  nicType: { type: ['string', 'null'], optional: true },

  // set the VM boot firmware mode
  hvmBootFirmware: { type: ['string', 'null'], optional: true },

  virtualizationMode: { type: 'string', optional: true },

  viridian: { type: 'boolean', optional: true },

  blockedOperations: { type: 'object', optional: true, properties: { '*': { type: ['boolean', 'null', 'string'] } } },

  creation: {
    type: 'object',
    optional: true,
    properties: {
      user: { type: 'string', optional: true },
    },
  },

  suspendSr: { type: ['string', 'null'], optional: true },

  uefiMode: { enum: ['setup', 'user'], optional: true },

  xenStoreData: {
    description: 'properties that should be set or deleted (if null) in the VM XenStore',
    optional: true,
    type: 'object',
    additionalProperties: {
      type: ['null', 'string'],
    },
  },
}

set.resolve = {
  VM: ['id', ['VM', 'VM-snapshot', 'VM-template'], 'administrate'],
  suspendSr: ['suspendSr', 'SR', 'administrate'],
}

// -------------------------------------------------------------------

export const setAndRestart = defer(async function ($defer, params) {
  const vm = params.VM
  const force = extract(params, 'force')

  await stop.bind(this)({ vm, force })

  $defer(start.bind(this), { vm, force })

  return set.bind(this)(params)
})

setAndRestart.params = {
  // Restart options
  force: { type: 'boolean', optional: true },

  // Set params
  ...set.params,
}

setAndRestart.resolve = set.resolve

// -------------------------------------------------------------------

export const restart = defer(async function ($defer, { vm, force = false, bypassBlockedOperation = force }) {
  const xapi = this.getXapi(vm)
  if (bypassBlockedOperation) {
    await Promise.all(
      RESTART_OPERATIONS.map(async operation => {
        const reason = vm.blockedOperations[operation]
        if (reason !== undefined) {
          await xapi.call('VM.remove_from_blocked_operations', vm._xapiRef, operation)
          $defer(() => xapi.call('VM.add_to_blocked_operations', vm._xapiRef, operation, reason))
        }
      })
    )
  }
  return xapi.rebootVm(vm._xapiId, { hard: force })
})

restart.params = {
  id: { type: 'string' },
  force: { type: 'boolean', optional: true },
  bypassBlockedOperation: { type: 'boolean', optional: true },
}

restart.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export const clone = defer(async function ($defer, { vm, name, full_copy: fullCopy }) {
  await checkPermissionOnSrs.call(this, vm)
  const xapi = this.getXapi(vm)

  const newVm = await xapi.cloneVm(vm._xapiRef, {
    nameLabel: name,
    fast: !fullCopy,
  })
  $defer.onFailure(() => xapi.VM_destroy(newVm.$ref))

  // A snapshot may have its `is_a_template` flag set to true, which isn't
  // automatically set to false when cloning it
  if (vm.type !== 'VM-template') {
    await newVm.set_is_a_template(false)
  }

  const isAdmin = this.apiContext.permission === 'admin'
  if (!isAdmin) {
    await this.addAcl(this.apiContext.user.id, newVm.$id, 'admin')
  }

  if (vm.resourceSet !== undefined) {
    await this.allocateLimitsInResourceSet(await this.computeVmResourcesUsage(vm), vm.resourceSet)
  }

  return newVm.$id
})

clone.params = {
  id: { type: 'string' },
  name: { type: 'string' },
  full_copy: { type: 'boolean' },
}

clone.resolve = {
  vm: ['id', ['VM', 'VM-snapshot', 'VM-template'], 'administrate'],
}

// -------------------------------------------------------------------

// TODO: implement resource sets
export async function copy({ compress, name: nameLabel, sr, vm }) {
  let newVm
  if (vm.$pool === sr.$pool) {
    if (vm.power_state === 'Running') {
      await checkPermissionOnSrs.call(this, vm)
    }

    newVm = await this.getXapi(vm).copyVm(vm._xapiId, {
      nameLabel,
      srOrSrId: sr._xapiId,
    })
  } else {
    newVm = (
      await this.getXapi(vm).remoteCopyVm(vm._xapiId, this.getXapi(sr), sr._xapiId, {
        compress,
        nameLabel,
      })
    ).vm
  }

  // A snapshot may have its `is_a_template` flag set to true, which isn't
  // automatically set to false when copying it
  if (vm.type !== 'VM-template') {
    await newVm.set_is_a_template(false)
  }

  return newVm.$id
}

copy.params = {
  compress: {
    type: ['boolean', 'string'],
    optional: true,
  },
  name: {
    type: 'string',
    optional: true,
  },
  vm: { type: 'string' },
  sr: { type: 'string' },
}

copy.resolve = {
  vm: ['vm', ['VM', 'VM-snapshot', 'VM-template'], 'administrate'],
  sr: ['sr', 'SR', 'operate'],
}

// -------------------------------------------------------------------

export async function convertToTemplate({ vm }) {
  // Convert to a template requires pool admin permission.
  await this.checkPermissions([[vm.$pool, 'administrate']])

  const xapi = this.getXapi(vm)
  const xapiVm = xapi.getObjectByRef(vm._xapiRef)

  // Attempts to eject all removable media
  const ignoreNotRemovable = error => {
    const { code } = error
    if (code !== 'VBD_IS_EMPTY' && code !== 'VBD_NOT_REMOVABLE_MEDIA') {
      throw error
    }
  }
  await asyncEach(xapiVm.VBDs, ref => xapi.callAsync('VBD.eject', ref).catch(ignoreNotRemovable))

  await xapiVm.set_is_a_template(true)
}

convertToTemplate.params = {
  id: { type: 'string' },
}

convertToTemplate.resolve = {
  vm: ['id', ['VM', 'VM-snapshot'], 'administrate'],
}

// TODO: remove when no longer used.
export const convert = 'convertToTemplate'

// -------------------------------------------------------------------

export async function copyToTemplate({ vm }) {
  const xapi = await this.getXapi(vm)
  const clonedVm = await xapi.copyVm(vm._xapiId, {
    nameLabel: vm.name_label,
  })
  try {
    await clonedVm.set_is_a_template(true)
  } catch (error) {
    ignoreErrors.call(clonedVm.$destroy())
    throw error
  }
}

copyToTemplate.params = {
  id: { type: 'string' },
}
copyToTemplate.resolve = {
  vm: ['id', ['VM-snapshot'], 'administrate'],
}

// -------------------------------------------------------------------

export const snapshot = defer(async function (
  $defer,
  { vm, name = `${vm.name_label}_${new Date().toISOString()}`, saveMemory = false, description }
) {
  const { user } = this.apiContext
  let resourceSet
  try {
    if (vm.resourceSet !== undefined) {
      resourceSet = await this.getResourceSet(vm.resourceSet)
    }
  } catch (error) {
    if (noSuchObject.is(error)) {
      log.warn('cannot find resource set', { resourceSet: vm.resourceSet })
    } else {
      throw error
    }
  }

  // Workaround: allow Resource Set members to snapshot a VM even though they
  // don't have operate permissions on the SR(s)
  if (
    resourceSet === undefined ||
    (!resourceSet.subjects.includes(user.id) && !user.groups.some(groupId => resourceSet.subjects.includes(groupId)))
  ) {
    await checkPermissionOnSrs.call(this, vm)
  }

  if (vm.resourceSet !== undefined) {
    // Compute the resource usage of the VM as if it was used by the snapshot
    const usage = await this.computeVmSnapshotResourcesUsage(vm)
    await this.allocateLimitsInResourceSet(usage, vm.resourceSet)
    $defer.onFailure(() => this.releaseLimitsInResourceSet(usage, vm.resourceSet))
  }

  const xapi = this.getXapi(vm)
  const snapshotRef = await xapi['VM_' + (saveMemory ? 'checkpoint' : 'snapshot')](vm._xapiRef, {
    ignoredVdisTag: '[NOSNAP]',
    name_label: name,
  })
  $defer.onFailure(() => xapi.VM_destroy(snapshotRef))

  const snapshotId = await xapi.getField('VM', snapshotRef, 'uuid')

  if (description !== undefined) {
    await xapi.editVm(snapshotId, { name_description: description })
  }

  if (this.apiContext.permission !== 'admin') {
    await this.addAcl(user.id, snapshotId, 'admin')
  }
  return snapshotId
})

snapshot.params = {
  description: { type: 'string', minLength: 0, optional: true },
  id: { type: 'string' },
  name: { type: 'string', optional: true },
  saveMemory: { type: 'boolean', optional: true },
}

snapshot.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export function start({ vm, bypassMacAddressesCheck, force, host }) {
  return this.getXapi(vm).startVm(vm._xapiId, { bypassMacAddressesCheck, force, hostId: host?._xapiId })
}

start.params = {
  bypassMacAddressesCheck: { type: 'boolean', optional: true },
  force: { type: 'boolean', optional: true },
  host: { type: 'string', optional: true },
  id: { type: 'string' },
}

start.resolve = {
  host: ['host', 'host', 'operate'],
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export const stop = defer(async function ($defer, { vm, force, forceShutdownDelay, bypassBlockedOperation = force }) {
  const xapi = this.getXapi(vm)

  if (bypassBlockedOperation) {
    await Promise.all(
      SHUTDOWN_OPERATIONS.map(async operation => {
        const reason = vm.blockedOperations[operation]
        if (reason !== undefined) {
          await xapi.call('VM.remove_from_blocked_operations', vm._xapiRef, operation)
          $defer(() => xapi.call('VM.add_to_blocked_operations', vm._xapiRef, operation, reason))
        }
      })
    )
  }

  // Hard shutdown
  if (force) {
    return xapi.shutdownVm(vm._xapiRef, { hard: true })
  }

  // Clean shutdown
  try {
    await timeout.call(xapi.shutdownVm(vm._xapiRef), forceShutdownDelay, () =>
      xapi.shutdownVm(vm._xapiRef, { hard: true })
    )
  } catch (error) {
    const { code } = error
    if (code === 'VM_MISSING_PV_DRIVERS' || code === 'VM_LACKS_FEATURE_SHUTDOWN') {
      throw invalidParameters('clean shutdown requires PV drivers')
    }
    throw error
  }
})

stop.params = {
  id: { type: 'string' },
  force: { type: 'boolean', optional: true },
  forceShutdownDelay: { type: 'number', default: 0 },
  bypassBlockedOperation: { type: 'boolean', optional: true },
}

stop.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export async function suspend({ vm }) {
  await this.getXapi(vm).callAsync('VM.suspend', vm._xapiRef)
}

suspend.params = {
  id: { type: 'string' },
}

suspend.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export async function pause({ vm }) {
  await this.getXapi(vm).callAsync('VM.pause', vm._xapiRef)
}

pause.params = {
  id: { type: 'string' },
}

pause.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export function resume({ vm }) {
  return this.getXapi(vm).resumeVm(vm._xapiId)
}

resume.params = {
  id: { type: 'string' },
}

resume.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export const revert = defer(async function ($defer, { snapshot }) {
  await this.checkPermissions([[snapshot.$snapshot_of, 'operate']])
  const vm = this.getObject(snapshot.$snapshot_of)
  const { resourceSet } = vm
  if (resourceSet !== undefined) {
    const vmUsage = await this.computeVmResourcesUsage(vm)
    await this.releaseLimitsInResourceSet(vmUsage, resourceSet)
    $defer.onFailure(() => this.allocateLimitsInResourceSet(vmUsage, resourceSet, true))

    // Deallocate IP addresses
    const vmIpsByVif = {}
    vm.VIFs.forEach(vifId => {
      const vif = this.getObject(vifId)
      vmIpsByVif[vifId] = [...vif.allowedIpv4Addresses, ...vif.allowedIpv6Addresses]
    })
    await Promise.all(Object.entries(vmIpsByVif).map(([vifId, ips]) => this.allocIpAddresses(vifId, null, ips)))
    $defer.onFailure(() =>
      Promise.all(Object.entries(vmIpsByVif).map(([vifId, ips]) => this.allocIpAddresses(vifId, ips)))
    )

    // Compute the resource usage of the snapshot that's being reverted as if it
    // was used by the VM
    const snapshotUsage = await this.computeVmResourcesUsage(snapshot)
    await this.allocateLimitsInResourceSet(snapshotUsage, resourceSet)
    $defer.onFailure(() => this.releaseLimitsInResourceSet(snapshotUsage, resourceSet))

    // Reallocate the snapshot's IP addresses
    const snapshotIpsByVif = {}
    snapshot.VIFs.forEach(vifId => {
      const vif = this.getObject(vifId)
      snapshotIpsByVif[vifId] = [...vif.allowedIpv4Addresses, ...vif.allowedIpv6Addresses]
    })
    await Promise.all(Object.entries(snapshotIpsByVif).map(([vifId, ips]) => this.allocIpAddresses(vifId, ips)))
    $defer.onFailure(() =>
      Promise.all(Object.entries(snapshotIpsByVif).map(([vifId, ips]) => this.allocIpAddresses(vifId, null, ips)))
    )
  }
  await this.getXapi(snapshot).revertVm(snapshot._xapiId)

  // Reverting a snapshot must not set the VM back to the old resource set
  await this.getXapi(vm).xo.setData(vm._xapiId, 'resourceSet', resourceSet === undefined ? null : resourceSet)
})

revert.params = {
  snapshot: { type: 'string' },
}

revert.resolve = {
  snapshot: ['snapshot', 'VM-snapshot', 'view'],
}

// -------------------------------------------------------------------

async function handleExport(req, res, { xapi, vmRef, compress, format = 'xva' }) {
  // @todo : should we put back the handleExportFAIL_ON_QUEUE ?
  const stream =
    format === 'ova' ? await xapi.exportVmOva(vmRef) : (await xapi.VM_export(FAIL_ON_QUEUE, vmRef, { compress })).body

  res.on('close', () => stream.on('error', noop).destroy())

  res.setHeader('content-disposition', 'attachment')
  stream.pipe(res)
}

// TODO: integrate in xapi.js
async function export_({ vm, compress, format = 'xva' }) {
  if (vm.power_state === 'Running') {
    await checkPermissionOnSrs.call(this, vm)
  }

  const data = {
    xapi: this.getXapi(vm),
    vmRef: vm._xapiRef,
    compress,
    format,
  }

  return {
    $getFrom: await this.registerHttpRequest(handleExport, data, {
      suffix: '/' + encodeURIComponent(`${safeDateFormat(new Date())} - ${vm.name_label}.${format}`),
    }),
  }
}

export_.params = {
  vm: { type: 'string' },
  compress: { type: ['boolean', 'string'], optional: true },
  format: { enum: ['xva', 'ova'], optional: true },
}

export_.resolve = {
  vm: ['vm', ['VM', 'VM-snapshot'], 'administrate'],
}

export { export_ as export }

// -------------------------------------------------------------------

/**
 * here we expect to receive a POST in multipart/form-data
 * When importing an OVA file:
 *  - The first parts are the tables in uint32 LE
 *    - grainLogicalAddressList : uint32 LE in VMDK blocks
 *    - grainFileOffsetList : uint32 LE in sectors, limits the biggest VMDK size to 2^41B (2^32 * 512B)
 *  - the last part is the ova file.
 */
async function handleVmImport(req, res, { data, srId, type, xapi }) {
  // Timeout seems to be broken in Node 4.
  // See https://github.com/nodejs/node/issues/3319
  req.setTimeout(43200000) // 12 hours

  // expect "multipart/form-data; boundary=something"
  const contentType = req.headers['content-type']
  const vm = await (contentType !== undefined && contentType.startsWith('multipart/form-data')
    ? new Promise((resolve, reject) => {
        const form = new multiparty.Form()
        const promises = []
        const tables = {}
        form.on('error', reject)
        form.on('part', async part => {
          try {
            if (part.name !== 'file') {
              promises.push(
                (async () => {
                  if (!(part.filename in tables)) {
                    tables[part.filename] = {}
                  }
                  const buffer = await getStreamAsBuffer(part)
                  tables[part.filename][part.name] = new Uint32Array(
                    buffer.buffer,
                    buffer.byteOffset,
                    buffer.length / Uint32Array.BYTES_PER_ELEMENT
                  )
                  data.tables = tables
                })()
              )
            } else {
              await Promise.all(promises)
              // XVA files are directly sent to xcp-ng who wants a content-length
              part.length = part.byteCount
              resolve(xapi.importVm(part, { data, srId, type }))
            }
          } catch (e) {
            // multiparty is not promise-aware, we have to chain errors ourselves.
            reject(e)
          }
        })
        form.parse(req)
      })
    : xapi.importVm(req, { data, srId, type }))
  res.end(format.response(0, vm.$id))
}

// TODO: "sr_id" can be passed in URL to target a specific SR
async function import_({ data, sr, type = 'xva', url }) {
  if (data && type === 'xva') {
    throw invalidParameters('unsupported field data for the file type xva')
  }

  const xapi = this.getXapi(sr)
  const srId = sr._xapiId

  if (url !== undefined) {
    if (type !== 'xva') {
      throw invalidParameters('URL import is only compatible with XVA')
    }

    const ref = await xapi.VM_import(await hrp(url), sr._xapiRef)
    return xapi.call('VM.get_uuid', ref)
  }

  return {
    $sendTo: await this.registerApiHttpRequest(
      'vm.import',
      this.apiContext.connection,
      handleVmImport,
      { data, srId, type, xapi },
      { exposeAllErrors: true }
    ),
  }
}

import_.params = {
  data: {
    type: 'object',
    optional: true,
    properties: {
      descriptionLabel: { type: 'string', minLength: 0 },
      disks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            capacity: { type: 'integer' },
            descriptionLabel: { type: 'string', minLength: 0 },
            nameLabel: { type: 'string' },
            path: { type: 'string' },
            position: { type: 'integer' },
          },
        },
        optional: true,
      },
      memory: { type: 'integer' },
      nameLabel: { type: 'string' },
      nCpus: { type: 'integer' },
      networks: {
        type: 'array',
        items: { type: 'string' },
        optional: true,
      },
    },
    additionalProperties: true,
  },
  type: { type: 'string', optional: true },
  sr: { type: 'string' },
  url: { type: 'string', optional: true },
}

import_.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

export { import_ as import }

export async function importFromEsxi({
  host,
  network,
  password,
  sr,
  sslVerify = true,
  stopSource = false,
  template,
  user,
  vm,
  workDirRemote,
}) {
  return importMultipleFromEsxi.call(this, {
    host,
    network,
    password,
    sr,
    sslVerify,
    stopSource,
    template,
    user,
    vms: [vm],
    workDirRemote,
  })
}

importFromEsxi.params = {
  host: { type: 'string' },
  network: { type: 'string' },
  password: { type: 'string' },
  sr: { type: 'string' },
  sslVerify: { type: 'boolean', optional: true },
  stopSource: { type: 'boolean', optional: true },
  user: { type: 'string' },
  template: { type: 'string' },
  vm: { type: 'string' },
  workDirRemote: { type: 'string', optional: true },
}

/**
 * on success:  returns an object, the keys are the esxi id, and the values are the created vm uuid
 * On error: throw an error. If stopOnError is false, continue when an error occurs, throws an error at the end with a 'succeeded'
 * property listing the VM properly imported and a 'errors' property with all the errors collected
 */
export async function importMultipleFromEsxi({
  concurrency,
  host,
  network,
  password,
  sr,
  sslVerify,
  stopSource,
  stopOnError,
  thin,
  template,
  user,
  vms,
  workDirRemote,
}) {
  const task = await this.tasks.create({ name: `importing vms ${vms.join(',')}` })
  let done = 0
  return task.run(async () => {
    const PREFIX = '[vmware]'
    const handlers = await Promise.all(
      (await this.getAllRemotes())
        .filter(({ name, enabled }) => enabled && name.toLocaleLowerCase().startsWith(PREFIX))
        .map(remote => this.getRemoteHandler(remote))
    )
    const workDirRemoteHandler = workDirRemote ? await this.getRemoteHandler(workDirRemote) : undefined
    const dataStoreToHandlers = {}
    handlers.forEach(handler => {
      const name = handler._remote.name
      const dataStoreName = name.substring(PREFIX.length).trim()
      dataStoreToHandlers[dataStoreName] = handler
    })

    Task.set('total', vms.length)
    Task.set('done', 0)
    Task.set('progress', 0)
    const result = {}
    try {
      await asyncEach(
        vms,
        async vm => {
          await Task.run({ properties: { name: `importing vm ${vm}` } }, async () => {
            try {
              const vmUuid = await this.migrationfromEsxi({
                host,
                user,
                password,
                sslVerify,
                thin,
                vm,
                sr,
                network,
                stopSource,
                template,
                dataStoreToHandlers,
                workDirRemote: workDirRemoteHandler,
              })
              result[vm] = vmUuid
            } finally {
              done++
              Task.set('done', done)
              Task.set('progress', Math.round((done * 100) / vms.length))
            }
          })
        },
        {
          concurrency,
          stopOnError,
        }
      )
      return result
    } catch (error) {
      // if stopOnError is true :
      //   error is the original error , `suceeded` property {[esxi vm id]: xen vm id} contains only the VMs migrated before the error.
      //   VMs started before the error and finished migration after won't be in
      // else
      //    error is an AggregatedError with an `errors` property containing all the errors
      //    and a `succeeded` property  {[esxi vm id]: xen vm id} containing all the migrated VMs
      error.succeeded = result
      throw error
    }
  })
}

importMultipleFromEsxi.params = {
  concurrency: {
    type: 'number',
    optional: true,
    default: 2,
    description: 'number of VM imports in parallel (the disks are imported in parallel in each VM import)',
  },
  host: { type: 'string' },
  network: { type: 'string' },
  password: { type: 'string' },
  sr: { type: 'string' },
  sslVerify: { type: 'boolean', optional: true, default: true },
  stopSource: { type: 'boolean', optional: true, default: false },
  stopOnError: {
    type: 'boolean',
    optional: true,
    default: false,
    description: 'should the import stop on the first error , default true . Warning, change the response format',
  },
  thin: { type: 'boolean', optional: true, default: false },
  template: { type: 'string' },
  user: { type: 'string' },
  vms: {
    items: {
      type: 'string',
      description: 'VM id to be imported, if used from cli use this syntax :  vms=json:\'["2","9","18"]\'',
    },
    minItems: 1,
    type: 'array',
    uniqueItems: true,
  },
  workDirRemote: { type: 'string', optional: true },
}

// -------------------------------------------------------------------

// FIXME: if position is used, all other disks after this position
// should be shifted.
export async function attachDisk({ vm, vdi, position, mode, bootable }) {
  await this.getXapi(vm).VBD_create({
    bootable,
    mode,
    userdevice: position,
    VDI: vdi._xapiRef,
    VM: vm._xapiRef,
  })
}

attachDisk.params = {
  bootable: {
    type: 'boolean',
    optional: true,
  },
  mode: { type: 'string', optional: true },
  position: { type: 'string', optional: true },
  vdi: { type: 'string' },
  vm: { type: 'string' },
}

attachDisk.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  vdi: ['vdi', 'VDI', 'administrate'],
}

// -------------------------------------------------------------------

// TODO: implement resource sets
export async function createInterface({ vm, network, position, mac, allowedIpv4Addresses, allowedIpv6Addresses }) {
  const { resourceSet } = vm
  if (resourceSet != null) {
    await this.checkResourceSetConstraints(resourceSet, this.apiContext.user.id, [network.id])
  } else {
    await this.checkPermissions([[network.id, 'view']])
  }

  let ipAddresses
  const xapi = this.getXapi(vm)
  const vif = await xapi._getOrWaitObject(
    await xapi.VIF_create(
      {
        device: position !== undefined ? String(position) : undefined,
        ipv4_allowed: allowedIpv4Addresses,
        ipv6_allowed: allowedIpv6Addresses,
        network: network._xapiRef,
        VM: vm._xapiRef,
      },
      {
        MAC: mac,
      }
    )
  )

  const { push } = (ipAddresses = [])
  if (allowedIpv4Addresses) {
    push.apply(ipAddresses, allowedIpv4Addresses)
  }
  if (allowedIpv6Addresses) {
    push.apply(ipAddresses, allowedIpv6Addresses)
  }
  if (ipAddresses.length) {
    ignoreErrors.call(this.allocIpAddresses(vif.$id, ipAddresses))
  }

  return vif.$id
}

createInterface.params = {
  vm: { type: 'string' },
  network: { type: 'string' },
  position: { type: ['integer', 'string'], optional: true },
  mac: { type: 'string', optional: true },
  allowedIpv4Addresses: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  allowedIpv6Addresses: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
}

createInterface.resolve = {
  // Not compatible with resource sets.
  // FIXME: find a workaround.
  network: ['network', 'network', ''],
  vm: ['vm', 'VM', 'administrate'],
}

// -------------------------------------------------------------------

// https://docs.xcp-ng.org/compute/#5-put-this-pci-device-into-your-vm
const formatPciIds = pciIds => '0/' + pciIds.join(',0/')
export async function attachPcis({ vm, pcis }) {
  await this.checkPermissions(pcis.map(id => [id, 'administrate']))

  const pciIds = pcis.map(id => this.getObject(id, 'PCI').pci_id)
  const uniquePciIds = Array.from(new Set((vm.attachedPcis ?? []).concat(pciIds)))

  await this.getXapiObject(vm).update_other_config('pci', formatPciIds(uniquePciIds))
}

attachPcis.params = {
  id: { type: 'string' },
  pcis: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}
attachPcis.resolve = {
  vm: ['id', 'VM', 'administrate'],
}

// -------------------------------------------------------------------

export async function detachPcis({ vm, pciIds }) {
  const newAttachedPciIds = vm.attachedPcis.filter(id => !pciIds.includes(id))
  await this.getXapiObject(vm).update_other_config(
    'pci',
    newAttachedPciIds.length === 0 ? null : formatPciIds(newAttachedPciIds)
  )
}

detachPcis.params = {
  id: { type: 'string' },
  pciIds: { type: 'array', items: { type: 'string' } },
}
detachPcis.resolve = {
  vm: ['id', 'VM', 'administrate'],
}

// -------------------------------------------------------------------

export function stats({ vm, granularity }) {
  return this.getXapiVmStats(vm._xapiId, granularity)
}

stats.description = 'returns statistics about the VM'

stats.params = {
  id: { type: 'string' },
  granularity: {
    type: 'string',
    optional: true,
  },
}

stats.resolve = {
  vm: ['id', ['VM', 'VM-snapshot'], 'view'],
}

// -------------------------------------------------------------------

export async function setBootOrder({ vm, order }) {
  if (vm.virtualizationMode !== 'hvm') {
    throw invalidParameters('You can only set the boot order on a HVM guest')
  }

  await this.getXapiObject(vm).update_HVM_boot_params('order', order)
}

setBootOrder.params = {
  vm: { type: 'string' },
  order: { type: 'string' },
}

setBootOrder.resolve = {
  vm: ['vm', ['VM', 'VM-template'], 'operate'],
}

// -------------------------------------------------------------------

export function recoveryStart({ vm }) {
  return this.getXapi(vm).startVmOnCd(vm._xapiId)
}

recoveryStart.params = {
  id: { type: 'string' },
}

recoveryStart.resolve = {
  vm: ['id', 'VM', 'operate'],
}

// -------------------------------------------------------------------

export function getCloudInitConfig({ template }) {
  return this.getXapi(template).getCloudInitConfig(template._xapiId)
}

getCloudInitConfig.params = {
  template: { type: 'string' },
}

getCloudInitConfig.resolve = {
  template: ['template', 'VM-template', 'administrate'],
}

// -------------------------------------------------------------------

export async function createCloudInitConfigDrive({ config, coreos, networkConfig, sr, vm }) {
  const xapi = this.getXapi(vm)
  if (coreos) {
    // CoreOS is a special CloudConfig drive created by XS plugin
    await xapi.createCoreOsCloudInitConfigDrive(vm._xapiId, sr._xapiId, config)
  } else {
    // use generic Cloud Init drive
    await xapi.createCloudInitConfigDrive(vm._xapiId, sr._xapiId, config, networkConfig)
  }
}

createCloudInitConfigDrive.params = {
  vm: { type: 'string' },
  sr: { type: 'string' },
  config: { type: 'string' },
  networkConfig: { type: 'string', optional: true },
}

createCloudInitConfigDrive.resolve = {
  vm: ['vm', 'VM', 'administrate'],

  // Not compatible with resource sets.
  // FIXME: find a workaround.
  sr: ['sr', 'SR', ''], // 'operate' ]
}

// -------------------------------------------------------------------

export async function createVgpu({ vm, gpuGroup, vgpuType }) {
  // TODO: properly handle device. Can a VM have 2 vGPUS?
  await this.getXapi(vm).createVgpu(vm._xapiId, gpuGroup._xapiId, vgpuType._xapiId)
}

createVgpu.params = {
  vm: { type: 'string' },
  gpuGroup: { type: 'string' },
  vgpuType: { type: 'string' },
}

createVgpu.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  gpuGroup: ['gpuGroup', 'gpuGroup', ''],
  vgpuType: ['vgpuType', 'vgpuType', ''],
}

// -------------------------------------------------------------------

export async function deleteVgpu({ vgpu }) {
  await this.getXapi(vgpu).deleteVgpu(vgpu._xapiId)
}

deleteVgpu.params = {
  vgpu: { type: 'string' },
}

deleteVgpu.resolve = {
  vgpu: ['vgpu', 'vgpu', ''],
}

// -------------------------------------------------------------------

export async function coalesceLeaf({ vm }) {
  await this.getXapi(vm).VM_coalesceLeaf(vm._xapiRef)
}
coalesceLeaf.params = {
  id: { type: 'string' },
}
coalesceLeaf.resolve = {
  vm: ['id', 'VM', 'administrate'],
}
