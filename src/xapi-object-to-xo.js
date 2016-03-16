import {
  ensureArray,
  extractProperty,
  forEach,
  isArray,
  mapToArray,
  parseXml
} from './utils'
import {
  isHostRunning,
  isVmHvm,
  isVmRunning,
  parseDateTime
} from './xapi'

// ===================================================================

const {
  defineProperties,
  freeze
} = Object

function link (obj, prop, idField = '$id') {
  const dynamicValue = obj[`$${prop}`]
  if (dynamicValue == null) {
    return dynamicValue // Properly handles null and undefined.
  }

  if (isArray(dynamicValue)) {
    return mapToArray(dynamicValue, idField)
  }

  return dynamicValue[idField]
}

// Parse a string date time to a Unix timestamp (in seconds).
//
// If there are no data or if the timestamp is 0, returns null.
function toTimestamp (date) {
  if (!date) {
    return null
  }

  const ms = parseDateTime(date).getTime()
  if (!ms) {
    return null
  }

  return Math.round(ms / 1000)
}

// ===================================================================

const TRANSFORMS = {
  pool (obj) {
    return {
      default_SR: link(obj, 'default_SR'),
      HA_enabled: Boolean(obj.ha_enabled),
      master: link(obj, 'master'),
      tags: obj.tags,
      name_description: obj.name_description,
      name_label: obj.name_label || obj.$master.name_label

      // TODO
      // - ? networks = networksByPool.items[pool.id] (network.$pool.id)
      // - hosts = hostsByPool.items[pool.id] (host.$pool.$id)
      // - patches = poolPatchesByPool.items[pool.id] (poolPatch.$pool.id)
      // - SRs = srsByContainer.items[pool.id] (sr.$container.id)
      // - templates = vmTemplatesByContainer.items[pool.id] (vmTemplate.$container.$id)
      // - VMs = vmsByContainer.items[pool.id] (vm.$container.id)
      // - $running_hosts = runningHostsByPool.items[pool.id] (runningHost.$pool.id)
      // - $running_VMs = runningVmsByPool.items[pool.id] (runningHost.$pool.id)
      // - $VMs = vmsByPool.items[pool.id] (vm.$pool.id)
    }
  },

  // -----------------------------------------------------------------

  host (obj) {
    const {
      $metrics: metrics,
      other_config: otherConfig
    } = obj

    const isRunning = isHostRunning(obj)

    return {
      address: obj.address,
      bios_strings: obj.bios_strings,
      build: obj.software_version.build_number,
      CPUs: obj.cpu_info,
      enabled: Boolean(obj.enabled),
      current_operations: obj.current_operations,
      hostname: obj.hostname,
      iSCSI_name: otherConfig.iscsi_iqn || null,
      license_params: obj.license_params,
      license_server: obj.license_server,
      name_description: obj.name_description,
      name_label: obj.name_label,
      memory: (function () {
        if (metrics) {
          const free = +metrics.memory_free
          const total = +metrics.memory_total

          return {
            usage: total - free,
            size: total
          }
        }

        return {
          usage: 0,
          total: 0
        }
      })(),
      patches: link(obj, 'patches'),
      powerOnMode: obj.power_on_mode,
      power_state: metrics
        ? (isRunning ? 'Running' : 'Halted')
        : 'Unknown',
      tags: obj.tags,
      version: obj.software_version.product_version,

      // TODO: dedupe.
      PIFs: link(obj, 'PIFs'),
      $PIFs: link(obj, 'PIFs'),
      PCIs: link(obj, 'PCIs'),
      $PCIs: link(obj, 'PCIs'),
      PGPUs: link(obj, 'PGPUs'),
      $PGPUs: link(obj, 'PGPUs'),

      $PBDs: link(obj, 'PBDs')

      // TODO:
      // - controller = vmControllersByContainer.items[host.id]
      // - SRs = srsByContainer.items[host.id]
      // - tasks = tasksByHost.items[host.id]
      // - templates = vmTemplatesByContainer.items[host.id]
      // - VMs = vmsByContainer.items[host.id]
      // - $vCPUs = sum(host.VMs, vm => host.CPUs.number)
    }
  },

  // -----------------------------------------------------------------

  vm (obj) {
    const {
      $guest_metrics: guestMetrics,
      $metrics: metrics,
      other_config: otherConfig
    } = obj

    const isHvm = isVmHvm(obj)
    const isRunning = isVmRunning(obj)

    const vm = {
      // type is redefined after for controllers/, templates &
      // snapshots.
      type: 'VM',

      addresses: guestMetrics && guestMetrics.networks || null,
      auto_poweron: Boolean(otherConfig.auto_poweron),
      boot: obj.HVM_boot_params,
      CPUs: {
        max: +obj.VCPUs_max,
        number: (
          isRunning && metrics
            ? +metrics.VCPUs_number
            : +obj.VCPUs_at_startup
        )
      },
      current_operations: obj.current_operations,
      docker: (function () {
        const monitor = otherConfig['xscontainer-monitor']
        if (!monitor) {
          return
        }

        if (monitor === 'False') {
          return {
            enabled: false
          }
        }

        const {
          docker_ps: process,
          docker_info: info,
          docker_version: version
        } = otherConfig

        return {
          enabled: true,
          info: info && parseXml(info).docker_info,
          process: process && parseXml(process).docker_ps,
          version: version && parseXml(version).docker_version
        }
      })(),

      // TODO: there is two possible value: "best-effort" and "restart"
      high_availability: Boolean(obj.ha_restart_priority),

      memory: (function () {
        const dynamicMin = +obj.memory_dynamic_min
        const dynamicMax = +obj.memory_dynamic_max
        const staticMin = +obj.memory_static_min
        const staticMax = +obj.memory_static_max

        const memory = {
          dynamic: [ dynamicMin, dynamicMax ],
          static: [ staticMin, staticMax ]
        }

        const gmMemory = guestMetrics && guestMetrics.memory

        if (!isRunning) {
          memory.size = dynamicMax
        } else if (gmMemory && gmMemory.used) {
          memory.usage = +gmMemory.used
          memory.size = +gmMemory.total
        } else if (metrics) {
          memory.size = +metrics.memory_actual
        } else {
          memory.size = dynamicMax
        }

        return memory
      })(),
      name_description: obj.name_description,
      name_label: obj.name_label,
      other: otherConfig,
      os_version: guestMetrics && guestMetrics.os_version || null,
      power_state: obj.power_state,
      snapshots: link(obj, 'snapshots'),
      tags: obj.tags,
      VIFs: link(obj, 'VIFs'),
      virtualizationMode: isHvm ? 'hvm' : 'pv',

      // <=> Are the Xen Server tools installed?
      //
      // - undefined: unknown status
      // - false: not optimized
      // - 'out of date': optimized but drivers should be updated
      // - 'up to date': optimized
      xenTools: (() => {
        if (!isRunning || !metrics) {
          // Unknown status, returns nothing.
          return
        }

        if (!guestMetrics) {
          return false
        }

        const { PV_drivers_version: { major, minor } } = guestMetrics
        if (major === undefined || minor === undefined) {
          return false
        }

        return guestMetrics.PV_drivers_up_to_date
          ? 'up to date'
          : 'out of date'
      })(),

      $container: (
        isRunning
          ? link(obj, 'resident_on')
          : link(obj, 'pool') // TODO: handle local VMs (`VM.get_possible_hosts()`).
      ),
      $VBDs: link(obj, 'VBDs'),

      // TODO: dedupe
      VGPUs: link(obj, 'VGPUs'),
      $VGPUs: link(obj, 'VGPUs')
    }

    if (obj.is_control_domain) {
      vm.type += '-controller'
    } else if (obj.is_a_snapshot) {
      vm.type += '-snapshot'

      vm.snapshot_time = toTimestamp(obj.snapshot_time)
      vm.$snapshot_of = link(obj, 'snapshot_of')
    } else if (obj.is_a_template) {
      vm.type += '-template'

      vm.CPUs.number = +obj.VCPUs_at_startup
      vm.template_info = {
        arch: otherConfig['install-arch'],
        disks: (function () {
          const {disks: xml} = otherConfig
          let data
          if (!xml || !(data = parseXml(xml)).provision) {
            return []
          }

          const disks = ensureArray(data.provision.disk)
          forEach(disks, function normalize (disk) {
            disk.bootable = disk.bootable === 'true'
            disk.size = +disk.size
            disk.SR = extractProperty(disk, 'sr')
          })

          return disks
        })(),
        install_methods: (function () {
          const {['install-methods']: methods} = otherConfig

          return methods ? methods.split(',') : []
        })(),
        install_repository: otherConfig['install-repository']
      }
    }

    if (obj.VCPUs_params && obj.VCPUs_params.weight) {
      vm.cpuWeight = obj.VCPUs_params.weight
    }

    if (!isHvm) {
      vm.PV_args = obj.PV_args
    }

    return vm
  },

  // -----------------------------------------------------------------

  sr (obj) {
    return {
      type: 'SR',

      content_type: obj.content_type,

      // TODO: Should it replace usage?
      physical_usage: +obj.physical_utilisation,

      name_description: obj.name_description,
      name_label: obj.name_label,
      size: +obj.physical_size,
      SR_type: obj.type,
      tags: obj.tags,
      usage: +obj.virtual_allocation,
      VDIs: link(obj, 'VDIs'),

      $container: (
        obj.shared
          ? link(obj, 'pool')
          : obj.$PBDs[0] && link(obj.$PBDs[0], 'host')
      ),
      $PBDs: link(obj, 'PBDs')
    }
  },

  // -----------------------------------------------------------------

  pbd (obj) {
    return {
      type: 'PBD',

      attached: obj.currently_attached,
      host: link(obj, 'host'),
      SR: link(obj, 'SR')
    }
  },

  // -----------------------------------------------------------------

  pif (obj) {
    return {
      type: 'PIF',

      attached: Boolean(obj.currently_attached),
      device: obj.device,
      dns: obj.DNS,
      disallowUnplug: Boolean(obj.disallow_unplug),
      gateway: obj.gateway,
      ip: obj.IP,
      mac: obj.MAC,
      management: Boolean(obj.management), // TODO: find a better name.
      mode: obj.ip_configuration_mode,
      mtu: +obj.MTU,
      netmask: obj.netmask,
      // A non physical PIF is a "copy" of an existing physical PIF (same device)
      // A physical PIF cannot be unplugged
      physical: Boolean(obj.physical),
      vlan: +obj.VLAN,
      $host: link(obj, 'host'),
      $network: link(obj, 'network')
    }
  },

  // -----------------------------------------------------------------

  vdi (obj) {
    if (!obj.managed) {
      return
    }

    const vdi = {
      type: 'VDI',

      name_description: obj.name_description,
      name_label: obj.name_label,
      size: +obj.virtual_size,
      snapshots: link(obj, 'snapshots'),
      tags: obj.tags,
      usage: +obj.physical_utilisation,

      $SR: link(obj, 'SR'),
      $VBDs: link(obj, 'VBDs')
    }

    if (obj.is_a_snapshot) {
      vdi.type += '-snapshot'
      vdi.snapshot_time = toTimestamp(obj.snapshot_time)
      vdi.$snapshot_of = link(obj, 'snapshot_of')
    }

    return vdi
  },

  // -----------------------------------------------------------------

  vbd (obj) {
    return {
      type: 'VBD',

      attached: Boolean(obj.currently_attached),
      bootable: Boolean(obj.bootable),
      is_cd_drive: obj.type === 'CD',
      position: obj.userdevice,
      read_only: obj.mode === 'RO',
      VDI: link(obj, 'VDI'),
      VM: link(obj, 'VM')
    }
  },

  // -----------------------------------------------------------------

  vif (obj) {
    return {
      type: 'VIF',

      attached: Boolean(obj.currently_attached),
      device: obj.device, // TODO: should it be cast to a number?
      MAC: obj.MAC,
      MTU: +obj.MTU,

      $network: link(obj, 'network'),
      $VM: link(obj, 'VM')
    }
  },

  // -----------------------------------------------------------------

  network (obj) {
    return {
      bridge: obj.bridge,
      MTU: +obj.MTU,
      name_description: obj.name_description,
      name_label: obj.name_label,
      tags: obj.tags,
      PIFs: link(obj, 'PIFs'),
      VIFs: link(obj, 'VIFs')
    }
  },

  // -----------------------------------------------------------------

  message (obj) {
    return {
      body: obj.body,
      name: obj.name,
      time: toTimestamp(obj.timestamp),

      $object: obj.obj_uuid // Special link as it is already an UUID.
    }
  },

  // -----------------------------------------------------------------

  task (obj) {
    return {
      created: toTimestamp(obj.created),
      current_operations: obj.current_operations,
      finished: toTimestamp(obj.finished),
      name_description: obj.name_description,
      name_label: obj.name_label,
      progress: +obj.progress,
      result: obj.result,
      status: obj.status,

      $host: link(obj, 'resident_on')
    }
  },

  // -----------------------------------------------------------------

  host_patch (obj) {
    return {
      applied: Boolean(obj.applied),
      time: toTimestamp(obj.timestamp_applied),
      pool_patch: link(obj, 'pool_patch', '$ref'),

      $host: link(obj, 'host')
    }
  },

  // -----------------------------------------------------------------

  pool_patch (obj) {
    return {
      id: obj.$ref,

      applied: Boolean(obj.pool_applied),
      description: obj.name_description,
      guidance: obj.after_apply_guidance,
      name: obj.name_label,
      size: +obj.size,
      uuid: obj.uuid,

      // TODO: what does it mean, should we handle it?
      // version: obj.version,

      // TODO: host.[$]pool_patches ←→ pool.[$]host_patches
      $host_patches: link(obj, 'host_patches')
    }
  },

  // -----------------------------------------------------------------

  pci (obj) {
    return {
      type: 'PCI',

      class_name: obj.class_name,
      device_name: obj.device_name,
      pci_id: obj.pci_id,

      $host: link(obj, 'host')
    }
  },

  // -----------------------------------------------------------------

  pgpu (obj) {
    return {
      type: 'PGPU',

      pci: link(obj, 'PCI'),

      // TODO: dedupe.
      host: link(obj, 'host'),
      $host: link(obj, 'host'),
      vgpus: link(obj, 'resident_VGPUs'),
      $vgpus: link(obj, 'resident_VGPUs')
    }
  },

  // -----------------------------------------------------------------

  vgpu (obj) {
    return {
      type: 'VGPU',

      currentlyAttached: Boolean(obj.currently_attached),
      device: obj.device,
      resident_on: link(obj, 'resident_on'),
      vm: link(obj, 'VM')
    }
  }
}

// ===================================================================

export default xapiObj => {
  const transform = TRANSFORMS[xapiObj.$type.toLowerCase()]
  if (!transform) {
    return
  }

  const xoObj = transform(xapiObj)
  if (!xoObj) {
    return
  }

  if (!('id' in xoObj)) {
    xoObj.id = xapiObj.$id
  }
  if (!('type' in xoObj)) {
    xoObj.type = xapiObj.$type
  }
  if (
    'uuid' in xapiObj &&
    !('uuid' in xoObj)
  ) {
    xoObj.uuid = xapiObj.uuid
  }
  xoObj.$pool = xapiObj.$pool.$id
  xoObj.$poolId = xoObj.$pool // TODO: deprecated, remove when no longer used in xo-web

  // Internal properties.
  defineProperties(xoObj, {
    _xapiId: {
      value: xapiObj.$id
    },
    _xapiRef: {
      value: xapiObj.$ref
    }
  })

  // Freezes and returns the new object.
  return freeze(xoObj)
}
