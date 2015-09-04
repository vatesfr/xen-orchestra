import forEach from 'lodash.foreach'
import isArray from 'lodash.isarray'
import map from 'lodash.map'

import {
  ensureArray,
  extractProperty,
  parseXml
} from './utils'
import {
  isHostRunning,
  isVmRunning
} from './xapi'

// ===================================================================

function link (obj, prop) {
  const dynamicValue = obj[`$${prop}`]
  if (dynamicValue == null) {
    return dynamicValue // Properly handles null and undefined.
  }

  if (isArray(dynamicValue)) {
    return map(dynamicValue, '$id')
  }

  return dynamicValue.$id
}

// The JSON interface of XAPI format dates incorrectly.
const JSON_DATE_RE = /^(\d{4})(\d{2})(\d{2})T(.+)$/
function fixJsonDate (date) {
  const matches = JSON_DATE_RE.exec(date)

  if (!matches) {
    return date
  }

  const [, year, month, day, time] = matches
  return `${year}-${month}-${day}T${time}`
}

function toTimestamp (date) {
  if (!date) {
    return null
  }

  return Math.round(Date.parse(fixJsonDate(date)) / 1000)
}

// ===================================================================

export function pool (obj) {
  return {
    default_SR: link(obj, 'default_SR'),
    HA_enabled: Boolean(obj.ha_enabled),
    master: link(obj, 'master'),
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
}

// -------------------------------------------------------------------

export function host (obj) {
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
    power_state: isRunning ? 'Running' : 'Halted',
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
}

// -------------------------------------------------------------------

export function vm (obj) {
  const {
    $guest_metrics: guestMetrics,
    $metrics: metrics,
    other_config: otherConfig
  } = obj

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
    PV_drivers: Boolean(guestMetrics),
    PV_drivers_up_to_date: Boolean(guestMetrics && guestMetrics.PV_drivers_up_to_date),
    snapshot_time: toTimestamp(obj.snapshot_time),
    snapshots: link(obj, 'snapshots'),
    VIFs: link(obj, 'VIFs'),

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
      })()
    }
  }

  return vm
}

// -------------------------------------------------------------------

export function sr (obj) {
  return {
    type: 'SR',

    content_type: obj.content_type,
    name_description: obj.name_description,
    name_label: obj.name_label,
    physical_usage: +obj.physical_utilisation,
    size: +obj.physical_size,
    SR_type: obj.type,
    usage: +obj.virtual_allocation,
    VDIs: link(obj, 'VDIs'),

    $container: (
      obj.shared
        ? link(obj, 'pool')
        : obj.$PBDs[0] && link(obj.$PBDs[0], 'host')
    ),
    $PBDs: link(obj, 'PBDs')
  }
}

// -------------------------------------------------------------------

export function pbd (obj) {
  return {
    type: 'PBD',

    attached: obj.currently_attached,
    host: link(obj, 'host'),
    SR: link(obj, 'SR')
  }
}

// -------------------------------------------------------------------

export function pif (obj) {
  return {
    type: 'PIF',

    attached: Boolean(obj.currently_attached),
    device: obj.device,
    IP: obj.IP,
    MAC: obj.MAC,
    management: Boolean(obj.management), // TODO: find a better name.
    mode: obj.ip_configuration_mode,
    MTU: +obj.MTU,
    netmask: obj.netmask,
    vlan: +obj.VLAN,

    // TODO: What is it?
    //
    // Could it mean “is this a physical interface?”.
    // How could a PIF not be physical?
    // physical: obj.physical,

    $host: link(obj, 'host'),
    $network: link(obj, 'network')
  }
}

// -------------------------------------------------------------------

// TODO: should we have a VDI-snapshot type like we have with VMs?
export function vdi (obj) {
  if (!obj.managed) {
    return
  }

  return {
    type: 'VDI',

    name_description: obj.name_description,
    name_label: obj.name_label,
    size: +obj.virtual_size,
    snapshots: link(obj, 'snapshots'),
    snapshot_time: toTimestamp(obj.snapshot_time),
    usage: +obj.physical_utilisation,

    $snapshot_of: link(obj, 'snapshot_of'),
    $SR: link(obj, 'SR'),
    $VBDs: link(obj, 'VBDs')
  }
}

// -------------------------------------------------------------------

export function vbd (obj) {
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
}

// -------------------------------------------------------------------

export function vif (obj) {
  return {
    type: 'VIF',

    attached: Boolean(obj.currently_attached),
    device: obj.device, // TODO: should it be cast to a number?
    MAC: obj.MAC,
    MTU: +obj.MTU,

    $network: link(obj, 'network'),
    $VM: link(obj, 'VM')
  }
}

// -------------------------------------------------------------------

export function network (obj) {
  return {
    bridge: obj.bridge,
    MTU: +obj.MTU,
    name_description: obj.name_description,
    name_label: obj.name_label,
    PIFs: link(obj, 'PIFs'),
    VIFs: link(obj, 'VIFs')
  }
}

// -------------------------------------------------------------------

export function message (obj) {
  return {
    body: obj.body,
    name: obj.name,
    time: toTimestamp(obj.timestamp),

    $object: obj.obj_uuid // Special link as it is already an UUID.
  }
}

// -------------------------------------------------------------------

export function task (obj) {
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
}

// -------------------------------------------------------------------

export function host_patch (obj) {
  return {
    applied: Boolean(obj.applied),
    time: toTimestamp(obj.timestamp_applied),
    pool_patch: link(obj, 'pool_patch'),

    $host: link(obj, 'host')
  }
}

// -------------------------------------------------------------------

export function pool_patch (obj) {
  return {
    applied: Boolean(obj.pool_applied),
    name_description: obj.name_description,
    name_label: obj.name_label,
    size: +obj.size,
    version: obj.version,

    // TODO: host.[$]pool_patches ←→ pool.[$]host_patches
    $host_patches: link(obj, 'host_patches')
  }
}

// -------------------------------------------------------------------

export function pci (obj) {
  return {
    type: 'PCI',

    class_name: obj.class_name,
    device_name: obj.device_name,
    pci_id: obj.pci_id,

    $host: link(obj, 'host')
  }
}

// -------------------------------------------------------------------

export function pgpu (obj) {
  return {
    type: 'PGPU',

    pci: link(obj, 'PCI'),

    // TODO: dedupe.
    host: link(obj, 'host'),
    $host: link(obj, 'host'),
    vgpus: link(obj, 'resident_VGPUs'),
    $vgpus: link(obj, 'resident_VGPUs')
  }
}

// -------------------------------------------------------------------

export function vgpu (obj) {
  return {
    type: 'VGPU',

    currentlyAttached: Boolean(obj.currently_attached),
    device: obj.device,
    resident_on: link(obj, 'resident_on'),
    vm: link(obj, 'VM')
  }
}
