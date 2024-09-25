import { isDefaultTemplate, parseDateTime } from '@xen-orchestra/xapi'
import Obfuscate from '@vates/obfuscate'

import * as xoData from '@xen-orchestra/xapi/xoData.mjs'
import ensureArray from './_ensureArray.mjs'
import normalizeVmNetworks from './_normalizeVmNetworks.mjs'
import { createLogger } from '@xen-orchestra/log'
import { extractIpFromVmNetworks } from './_extractIpFromVmNetworks.mjs'
import { extractProperty, forEach, isEmpty, mapFilter, parseXml } from './utils.mjs'
import { getVmDomainType, isHostRunning, isVmRunning } from './xapi/index.mjs'
import { useUpdateSystem } from './xapi/utils.mjs'

const { debug, warn } = createLogger('xo:server:xapi-objects-to-xo')

// ===================================================================

const ALLOCATION_BY_TYPE = {
  ext: 'thin',
  file: 'thin',
  hba: 'thick',
  iscsi: 'thick',
  lvhd: 'thick',
  lvhdofcoe: 'thick',
  lvhdohba: 'thick',
  lvhdoiscsi: 'thick',
  lvm: 'thick',
  lvmofcoe: 'thick',
  lvmohba: 'thick',
  lvmoiscsi: 'thick',
  nfs: 'thin',
  ocfs: 'thick',
  ocfsohba: 'thick',
  ocfsoiscsi: 'thick',
  rawhba: 'thick',
  rawiscsi: 'thick',
  shm: 'thin',
  smb: 'thin',
  udev: 'thick',
  xosan: 'thin',
  zfs: 'thin',
}

// ===================================================================

const { defineProperties, freeze } = Object

function link(obj, prop, idField = '$id') {
  const dynamicValue = obj[`$${prop}`]
  if (dynamicValue == null) {
    return dynamicValue // Properly handles null and undefined.
  }

  if (Array.isArray(dynamicValue)) {
    return dynamicValue.map(_ => _?.[idField])
  }

  return dynamicValue[idField]
}

function toTimestamp(date) {
  if (date === undefined) {
    return null
  }

  try {
    return parseDateTime(date)
  } catch (error) {
    warn('toTimestamp', { date, error })
    return null
  }
}

// https://github.com/xenserver/xenadmin/blob/093ab0bcd6c4b3dd69da7b1e63ef34bb807c1ddb/XenModel/XenAPI-Extensions/VM.cs#L773-L827
const getVmGuestToolsProps = vm => {
  const { $metrics: metrics, $guest_metrics: guestMetrics } = vm
  if (!isVmRunning(vm) || metrics === undefined || guestMetrics === undefined) {
    return {}
  }

  const { build, major, micro, minor } = guestMetrics.PV_drivers_version
  const hasPvVersion = major !== undefined && minor !== undefined

  // "PV_drivers_detected" field doesn't exist on XS < 7
  const pvDriversDetected = guestMetrics.PV_drivers_detected ?? hasPvVersion

  return {
    // Linux VMs don't have the flag "feature-static-ip-setting"
    managementAgentDetected: hasPvVersion || guestMetrics.other['feature-static-ip-setting'] === '1',
    pvDriversDetected,
    pvDriversVersion: hasPvVersion ? `${major}.${minor}.${micro}-${build}` : undefined,
    pvDriversUpToDate: pvDriversDetected ? guestMetrics.PV_drivers_up_to_date : undefined,
  }
}

// ===================================================================

const TRANSFORMS = {
  pool(obj) {
    const cpuInfo = obj.cpu_info
    return {
      auto_poweron: obj.other_config.auto_poweron === 'true',
      crashDumpSr: link(obj, 'crash_dump_SR'),
      current_operations: obj.current_operations,
      default_SR: link(obj, 'default_SR'),
      HA_enabled: Boolean(obj.ha_enabled),

      // ignore undefined VDIs, which occurs if the objects were not fetched/cached yet.
      haSrs: obj.$ha_statefiles.filter(vdi => vdi !== undefined).map(vdi => link(vdi, 'SR')),

      master: link(obj, 'master'),
      tags: obj.tags,
      name_description: obj.name_description,
      name_label: obj.name_label || obj.$master.name_label,
      migrationCompression: obj.migration_compression,
      xosanPackInstallationTime: toTimestamp(obj.other_config.xosan_pack_installation_time),
      otherConfig: obj.other_config,
      cpus: {
        cores: cpuInfo && +cpuInfo.cpu_count,
        sockets: cpuInfo && +cpuInfo.socket_count,
      },
      suspendSr: link(obj, 'suspend_image_SR'),
      zstdSupported: obj.restrictions.restrict_zstd_export === 'false',
      vtpmSupported: obj.restrictions.restrict_vtpm === 'false',

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

  host(obj, dependents) {
    dependents[obj.metrics] = obj.$id

    const { $metrics: metrics, other_config: otherConfig, software_version: softwareVersion } = obj

    const isRunning = isHostRunning(obj)
    let supplementalPacks

    if (useUpdateSystem(obj)) {
      supplementalPacks = []

      forEach(obj.$updates, update => {
        const formattedUpdate = {
          name: update.name_label,
          description: update.name_description,
          author: update.key.split('-')[3],
          version: update.version,
          guidance: update.after_apply_guidance,
          hosts: link(update, 'hosts'),
          vdi: link(update, 'vdi'),
          size: update.installation_size,
        }

        if (update.name_label.startsWith('XS')) {
          // It's a patch update but for homogeneity, we're still using pool_patches
        } else {
          supplementalPacks.push(formattedUpdate)
        }
      })
    }

    const cpuInfo = obj.cpu_info

    return {
      // Deprecated
      CPUs: cpuInfo,

      address: obj.address,
      bios_strings: obj.bios_strings,
      build: softwareVersion.build_number,
      chipset_info: {
        iommu: obj.chipset_info.iommu !== undefined ? obj.chipset_info.iommu === 'true' : undefined,
      },
      enabled: Boolean(obj.enabled),
      controlDomain: link(obj, 'control_domain'),
      cpus: {
        cores: cpuInfo && +cpuInfo.cpu_count,
        sockets: cpuInfo && +cpuInfo.socket_count,
      },
      current_operations: obj.current_operations,
      hostname: obj.hostname,
      iscsiIqn: obj.iscsi_iqn ?? otherConfig.iscsi_iqn ?? '',
      zstdSupported: obj.license_params.restrict_zstd_export === 'false',
      license_params: obj.license_params,
      license_server: obj.license_server,
      license_expiry: toTimestamp(obj.license_params.expiry),
      logging: obj.logging,
      name_description: obj.name_description,
      name_label: obj.name_label,
      memory: (function () {
        if (metrics) {
          const free = +metrics.memory_free
          let total = +metrics.memory_total
          const ONE_GIB = 1024 * 1024 * 1024
          total = Math.ceil(total / ONE_GIB) * ONE_GIB

          return {
            usage: total - free,
            size: total,
          }
        }

        return {
          usage: 0,
          size: 0,

          // Deprecated
          total: 0,
        }
      })(),
      multipathing: otherConfig.multipathing === 'true',
      otherConfig,
      patches: link(obj, 'patches'),
      powerOnMode: obj.power_on_mode,
      power_state: metrics ? (isRunning ? 'Running' : 'Halted') : 'Unknown',
      residentVms: link(obj, 'resident_VMs'),
      startTime: toTimestamp(otherConfig.boot_time),
      supplementalPacks:
        supplementalPacks ||
        mapFilter(softwareVersion, (value, key) => {
          let author, name
          if (([author, name] = key.split(':')).length === 2) {
            const [description, version] = value.split(', ')
            return {
              name,
              description,
              author,
              version: version.split(' ')[1],
            }
          }
        }),
      agentStartTime: toTimestamp(otherConfig.agent_start_time),
      rebootRequired:
        softwareVersion.product_brand === 'XCP-ng'
          ? toTimestamp(otherConfig.boot_time) < +otherConfig.rpm_patch_installation_time
          : !isEmpty(obj.updates_requiring_reboot),
      tags: obj.tags,
      version: softwareVersion.product_version,
      productBrand: softwareVersion.product_brand,
      hvmCapable: obj.capabilities.some(capability => capability.startsWith('hvm')),

      // Only exists on XCP-ng/CH >= 8.2
      certificates: obj.$certificates?.map(({ fingerprint, not_after }) => ({
        fingerprint,
        notAfter: toTimestamp(not_after),
      })),

      // TODO: dedupe.
      PIFs: link(obj, 'PIFs'),
      $PIFs: link(obj, 'PIFs'),
      PCIs: link(obj, 'PCIs'),
      $PCIs: link(obj, 'PCIs'),
      PGPUs: link(obj, 'PGPUs'),
      $PGPUs: link(obj, 'PGPUs'),

      $PBDs: link(obj, 'PBDs'),

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

  vm(obj, dependents) {
    dependents[obj.guest_metrics] = obj.$id
    dependents[obj.metrics] = obj.$id

    const { $guest_metrics: guestMetrics, $metrics: metrics, other_config: otherConfig } = obj

    const domainType = getVmDomainType(obj)
    const isHvm = domainType === 'hvm'
    const isRunning = isVmRunning(obj)
    const xenTools = (() => {
      if (!isRunning || !metrics) {
        // Unknown status, returns nothing.
        return
      }

      if (guestMetrics === undefined) {
        return false
      }

      const { major, minor } = guestMetrics.PV_drivers_version

      if (major === undefined || minor === undefined) {
        return false
      }

      return {
        major: +major,
        minor: +minor,
        version: +`${major}.${minor}`,
      }
    })()

    let resourceSet = otherConfig['xo:resource_set']
    if (resourceSet) {
      try {
        resourceSet = JSON.parse(resourceSet)
      } catch (_) {
        resourceSet = undefined
      }
    }

    // Build a { taskId → operation } map instead of forwarding the
    // { taskRef → operation } map directly
    const currentOperations = {}
    const { $xapi } = obj
    forEach(obj.current_operations, (operation, ref) => {
      const task = $xapi.getObjectByRef(ref, undefined)
      if (task !== undefined) {
        currentOperations[task.$id] = operation
      }
    })

    const { creation } = xoData.extract(obj) ?? {}

    let $container
    if (obj.resident_on !== 'OpaqueRef:NULL') {
      // resident_on is set when the VM is running (or paused or suspended on a host)
      $container = link(obj, 'resident_on')
    } else {
      // if the VM is halted, the $container is the pool
      $container = link(obj, 'pool')

      // unless one of its VDI is on a non shared SR
      //
      // linked objects may not be there when this code run, and it will only be
      // refreshed when the VM XAPI record change, this value is not guaranteed
      // to be up-to-date, but it practice it appears to work fine thanks to
      // `VBDs` and `current_operations` changing when a VDI is
      // added/removed/migrated
      for (const vbd of obj.$VBDs) {
        const sr = vbd?.$VDI?.$SR
        if (sr !== undefined && !sr.shared) {
          const pbd = sr.$PBDs[0]
          const hostId = pbd && link(pbd, 'host')
          if (hostId !== undefined) {
            $container = hostId
            break
          }
        }
      }
    }

    const vm = {
      // type is redefined after for controllers/, templates &
      // snapshots.
      type: 'VM',

      addresses: normalizeVmNetworks(guestMetrics?.networks ?? {}),
      affinityHost: link(obj, 'affinity'),
      attachedPcis: otherConfig.pci?.split(',')?.map(s => s.split('/')[1]),
      auto_poweron: otherConfig.auto_poweron === 'true',
      bios_strings: obj.bios_strings,
      blockedOperations: obj.blocked_operations,
      boot: obj.HVM_boot_params,
      CPUs: {
        max: +obj.VCPUs_max,
        number: isRunning && metrics && xenTools ? +metrics.VCPUs_number : +obj.VCPUs_at_startup,
      },
      creation,
      current_operations: currentOperations,
      docker: (function () {
        const monitor = otherConfig['xscontainer-monitor']
        if (!monitor) {
          return
        }

        if (monitor === 'False') {
          return {
            enabled: false,
          }
        }

        const { docker_ps: process, docker_info: info, docker_version: version } = otherConfig

        return {
          enabled: true,
          info: info && parseXml(info).docker_info,
          containers: ensureArray(process && parseXml(process).docker_ps.item),
          process: process && parseXml(process).docker_ps, // deprecated (only used in v4)
          version: version && parseXml(version).docker_version,
        }
      })(),
      expNestedHvm: obj.platform['exp-nested-hvm'] === 'true',
      viridian: obj.platform.viridian === 'true',
      mainIpAddress: extractIpFromVmNetworks(guestMetrics?.networks),
      high_availability: obj.ha_restart_priority,
      isFirmwareSupported: (() => {
        const restrictions = parseXml(obj.recommendations)?.restrictions?.restriction

        if (restrictions === undefined) {
          return true
        }

        const field = `supports-${obj.HVM_boot_params.firmware}`
        const firmwareRestriction = restrictions.find(restriction => restriction.field === field)

        return firmwareRestriction === undefined || firmwareRestriction.value !== 'no'
      })(),
      memory: (function () {
        const dynamicMin = +obj.memory_dynamic_min
        const dynamicMax = +obj.memory_dynamic_max
        const staticMin = +obj.memory_static_min
        const staticMax = +obj.memory_static_max

        const memory = {
          dynamic: [dynamicMin, dynamicMax],
          static: [staticMin, staticMax],
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
      installTime: metrics && toTimestamp(metrics.install_time),
      name_description: obj.name_description,
      name_label: obj.name_label,
      needsVtpm: obj.platform.vtpm === 'true',
      notes: otherConfig['xo:notes'],
      other: otherConfig,
      os_version: (guestMetrics && guestMetrics.os_version) || null,
      parent: link(obj, 'parent'),
      power_state: obj.power_state,
      hasVendorDevice: obj.has_vendor_device,
      resourceSet,
      snapshots: link(obj, 'snapshots'),
      startDelay: +obj.start_delay,
      startTime: metrics && toTimestamp(metrics.start_time),
      secureBoot: obj.platform.secureboot === 'true',
      suspendSr: link(obj, 'suspend_SR'),
      tags: obj.tags,
      VIFs: link(obj, 'VIFs'),
      VTPMs: link(obj, 'VTPMs'),
      virtualizationMode: domainType,

      // deprecated, use pvDriversVersion instead
      xenTools,
      ...getVmGuestToolsProps(obj),

      $container,
      $VBDs: link(obj, 'VBDs'),

      // TODO: dedupe
      VGPUs: link(obj, 'VGPUs'),
      $VGPUs: link(obj, 'VGPUs'),
      nicType: obj.platform.nic_type,
      xenStoreData: obj.xenstore_data,
    }

    if (isHvm) {
      ;({ vga: vm.vga = 'cirrus', videoram: vm.videoram = 4 } = obj.platform)
    }

    const coresPerSocket = obj.platform['cores-per-socket']
    if (coresPerSocket !== undefined) {
      vm.coresPerSocket = +coresPerSocket
    }

    if (obj.is_control_domain) {
      vm.type += '-controller'
    } else if (obj.is_a_snapshot) {
      vm.type += '-snapshot'

      vm.snapshot_time = toTimestamp(obj.snapshot_time)
      vm.$snapshot_of = link(obj, 'snapshot_of')
      vm.suspendVdi = link(obj, 'suspend_VDI')
    } else if (obj.is_a_template) {
      const defaultTemplate = isDefaultTemplate(obj)
      vm.type += '-template'
      if (defaultTemplate) {
        // scope by pool because default templates have the same UUID across pools
        vm.id = obj.$pool.uuid + '-' + obj.uuid
      }

      vm.CPUs.number = +obj.VCPUs_at_startup
      vm.isDefaultTemplate = defaultTemplate
      vm.template_info = {
        arch: otherConfig['install-arch'],
        disks: (function () {
          const { disks: xml } = otherConfig
          let data
          if (!xml || !(data = parseXml(xml)).provision) {
            return []
          }

          const disks = ensureArray(data.provision.disk)
          forEach(disks, function normalize(disk) {
            disk.bootable = disk.bootable === 'true'
            disk.size = +disk.size
            disk.SR = extractProperty(disk, 'sr')
          })

          return disks
        })(),
        install_methods: (function () {
          const methods = otherConfig['install-methods']

          return methods ? methods.split(',') : []
        })(),
        install_repository: otherConfig['install-repository'],
      }
    }

    let tmp
    if ((tmp = obj.VCPUs_params)) {
      tmp.cap && (vm.cpuCap = +tmp.cap)
      tmp.mask && (vm.cpuMask = tmp.mask.split(',').map(_ => +_))
      tmp.weight && (vm.cpuWeight = +tmp.weight)
    }

    if (!isHvm) {
      vm.PV_args = obj.PV_args
    }

    return vm
  },

  // -----------------------------------------------------------------

  sr(obj) {
    const srType = obj.type
    return {
      type: 'SR',

      content_type: obj.content_type,

      // TODO: Should it replace usage?
      physical_usage: +obj.physical_utilisation,

      allocationStrategy:
        srType === 'linstor' ? obj.$PBDs[0]?.device_config.provisioning ?? 'unknown' : ALLOCATION_BY_TYPE[srType],
      current_operations: obj.current_operations,
      inMaintenanceMode: obj.other_config['xo:maintenanceState'] !== undefined,
      name_description: obj.name_description,
      name_label: obj.name_label,
      size: +obj.physical_size,
      shared: Boolean(obj.shared),
      SR_type: srType,
      tags: obj.tags,
      usage: +obj.virtual_allocation,
      VDIs: link(obj, 'VDIs'),
      other_config: obj.other_config,
      sm_config: obj.sm_config,

      $container: obj.shared || !obj.$PBDs[0] ? link(obj, 'pool') : link(obj.$PBDs[0], 'host'),
      $PBDs: link(obj, 'PBDs'),
    }
  },

  // -----------------------------------------------------------------

  pbd(obj) {
    return {
      type: 'PBD',

      attached: Boolean(obj.currently_attached),
      host: link(obj, 'host'),
      SR: link(obj, 'SR'),
      device_config: Obfuscate.replace(obj.device_config, '* obfuscated *'),
      otherConfig: obj.other_config,
    }
  },

  // -----------------------------------------------------------------

  pif(obj) {
    const metrics = obj.$metrics

    return {
      type: 'PIF',

      attached: Boolean(obj.currently_attached),
      isBondMaster: !isEmpty(obj.bond_master_of),
      isBondSlave: obj.bond_slave_of !== 'OpaqueRef:NULL',
      device: obj.device,
      deviceName: metrics && metrics.device_name,
      dns: obj.DNS,
      disallowUnplug: Boolean(obj.disallow_unplug),
      gateway: obj.gateway,
      ip: obj.IP,
      ipv6: obj.IPv6,
      mac: obj.MAC,
      management: Boolean(obj.management), // TODO: find a better name.
      carrier: Boolean(metrics && metrics.carrier),
      mode: obj.ip_configuration_mode,
      ipv6Mode: obj.ipv6_configuration_mode,
      mtu: +obj.MTU,
      netmask: obj.netmask,
      // A non physical PIF is a "copy" of an existing physical PIF (same device)
      // A physical PIF cannot be unplugged
      physical: Boolean(obj.physical),
      primaryAddressType: obj.primary_address_type,
      vlan: +obj.VLAN,
      speed: metrics && +metrics.speed,
      $host: link(obj, 'host'),
      $network: link(obj, 'network'),
    }
  },

  // -----------------------------------------------------------------

  vdi(obj) {
    const vdi = {
      type: 'VDI',

      cbt_enabled: obj.cbt_enabled,
      missing: obj.missing,
      name_description: obj.name_description,
      name_label: obj.name_label,
      parent: obj.sm_config['vhd-parent'],
      size: +obj.virtual_size,
      snapshots: link(obj, 'snapshots'),
      tags: obj.tags,
      usage: +obj.physical_utilisation,
      VDI_type: obj.type,
      current_operations: obj.current_operations,
      other_config: obj.other_config,

      $SR: link(obj, 'SR'),
      $VBDs: link(obj, 'VBDs'),
    }

    if (obj.is_a_snapshot) {
      vdi.type += '-snapshot'
      vdi.snapshot_time = toTimestamp(obj.snapshot_time)
      vdi.$snapshot_of = link(obj, 'snapshot_of')
    } else if (!obj.managed) {
      vdi.type += '-unmanaged'
    }

    return vdi
  },

  // -----------------------------------------------------------------

  vbd(obj) {
    return {
      type: 'VBD',

      attached: Boolean(obj.currently_attached),
      bootable: Boolean(obj.bootable),
      device: obj.device || null,
      is_cd_drive: obj.type === 'CD',
      position: obj.userdevice,
      read_only: obj.mode === 'RO',
      VDI: link(obj, 'VDI'),
      VM: link(obj, 'VM'),
    }
  },

  // -----------------------------------------------------------------

  vif(obj) {
    const txChecksumming = obj.other_config['ethtool-tx']
    return {
      type: 'VIF',

      allowedIpv4Addresses: obj.ipv4_allowed,
      allowedIpv6Addresses: obj.ipv6_allowed,
      attached: Boolean(obj.currently_attached),
      device: obj.device, // TODO: should it be cast to a number?
      lockingMode: obj.locking_mode,
      MAC: obj.MAC,
      MTU: +obj.MTU,
      other_config: obj.other_config,

      // See: https://xapi-project.github.io/xen-api/networking.html
      txChecksumming: !(txChecksumming === 'false' || txChecksumming === 'off'),

      // in kB/s
      rateLimit: (() => {
        if (obj.qos_algorithm_type === 'ratelimit') {
          const { kbps } = obj.qos_algorithm_params
          if (kbps !== undefined) {
            return +kbps
          }
        }
      })(),

      $network: link(obj, 'network'),
      $VM: link(obj, 'VM'),
    }
  },

  // -----------------------------------------------------------------

  network(obj) {
    return {
      automatic: obj.other_config?.automatic === 'true',
      bridge: obj.bridge,
      current_operations: obj.current_operations,
      defaultIsLocked: obj.default_locking_mode === 'disabled',
      MTU: +obj.MTU,
      name_description: obj.name_description,
      name_label: obj.name_label,
      other_config: obj.other_config,
      tags: obj.tags,
      PIFs: link(obj, 'PIFs'),
      VIFs: link(obj, 'VIFs'),
      nbd: obj.purpose?.includes('nbd'),
      insecureNbd: obj.purpose?.includes('insecure_nbd'),
    }
  },

  // -----------------------------------------------------------------

  message(obj) {
    return {
      body: obj.body,
      name: obj.name,
      time: toTimestamp(obj.timestamp),

      $object: obj.obj_uuid, // Special link as it is already an UUID.
    }
  },

  // -----------------------------------------------------------------

  task(obj) {
    let applies_to
    if (obj.other_config.applies_to) {
      const object = obj.$xapi.getObject(obj.other_config.applies_to, undefined)
      if (object === undefined) {
        debug(
          `Unknown other_config.applies_to reference ${obj.other_config.applies_to} in task ${obj.$id}`
        )
      } else {
        applies_to = object.uuid
      }
    }
    return {
      allowedOperations: obj.allowed_operations,
      created: toTimestamp(obj.created),
      current_operations: obj.current_operations,
      finished: toTimestamp(obj.finished),
      name_description: obj.name_description,
      name_label: obj.name_label,
      progress: +obj.progress,
      result: obj.result,
      status: obj.status,
      xapiRef: obj.$ref,
      applies_to,
      $host: link(obj, 'resident_on'),
    }
  },

  // -----------------------------------------------------------------

  host_patch(obj) {
    const poolPatch = obj.$pool_patch
    return {
      type: 'patch',

      applied: Boolean(obj.applied),
      enforceHomogeneity: poolPatch.pool_applied,
      description: poolPatch.name_description,
      name: poolPatch.name_label,
      pool_patch: poolPatch.$ref,
      size: +poolPatch.size,
      guidance: poolPatch.after_apply_guidance,
      time: toTimestamp(obj.timestamp_applied),

      $host: link(obj, 'host'),
    }
  },

  // -----------------------------------------------------------------

  pool_patch(obj) {
    return {
      id: obj.$ref,

      dataUuid: obj.uuid, // UUID of the patch file as stated in Citrix's XML file
      description: obj.name_description,
      guidance: obj.after_apply_guidance,
      name: obj.name_label,
      size: +obj.size,
      uuid: obj.$ref,

      // TODO: means that the patch must be applied on every host
      // applied: Boolean(obj.pool_applied),

      // TODO: what does it mean, should we handle it?
      // version: obj.version,

      // TODO: host.[$]pool_patches ←→ pool.[$]host_patches
      $host_patches: link(obj, 'host_patches'),
    }
  },

  // -----------------------------------------------------------------

  pci(obj) {
    return {
      type: 'PCI',

      class_name: obj.class_name,
      device_name: obj.device_name,
      pci_id: obj.pci_id,

      $host: link(obj, 'host'),
    }
  },

  // -----------------------------------------------------------------

  pgpu(obj) {
    return {
      type: 'PGPU',

      dom0Access: obj.dom0_access,
      enabledVgpuTypes: link(obj, 'enabled_VGPU_types'),
      gpuGroup: link(obj, 'GPU_group'),
      isSystemDisplayDevice: Boolean(obj.is_system_display_device),
      pci: link(obj, 'PCI'),
      supportedVgpuMaxCapcities: link(obj, 'supported_VGPU_max_capacities'),
      supportedVgpuTypes: link(obj, 'supported_VGPU_types'),

      // TODO: dedupe.
      host: link(obj, 'host'),
      $host: link(obj, 'host'),
      vgpus: link(obj, 'resident_VGPUs'),
      $vgpus: link(obj, 'resident_VGPUs'),
    }
  },

  // -----------------------------------------------------------------

  vgpu(obj) {
    return {
      type: 'vgpu',

      currentlyAttached: Boolean(obj.currently_attached),
      device: obj.device,
      gpuGroup: link(obj, 'GPU_group'),
      otherConfig: obj.other_config,
      resident_on: link(obj, 'resident_on'),
      vgpuType: link(obj, '$type'),
      vm: link(obj, 'VM'),
    }
  },

  // -----------------------------------------------------------------

  gpu_group(obj) {
    return {
      type: 'gpuGroup',

      allocation: obj.allocation_algorithm,
      enabledVgpuTypes: link(obj, 'enabled_VGPU_types'),
      gpuTypes: obj.GPU_types,
      name_description: obj.name_description,
      name_label: obj.name_label,
      otherConfig: obj.other_config,
      pgpus: link(obj, 'PGPUs'),
      supportedVgpuTypes: link(obj, 'supported_VGPU_types'),
      vgpus: link(obj, 'VGPUs'),
    }
  },

  // -----------------------------------------------------------------

  vgpu_type(obj) {
    return {
      type: 'vgpuType',

      experimental: Boolean(obj.experimental),
      framebufferSize: obj.framebuffer_size,
      gpuGroups: link(obj, 'enabled_on_GPU_groups'),
      maxHeads: obj.max_heads,
      maxResolutionX: obj.max_resolution_x,
      maxResolutionY: obj.max_resolution_y,
      modelName: obj.model_name,
      pgpus: link(obj, 'enabled_on_PGPUs'),
      vendorName: obj.vendor_name,
      vgpus: link(obj, 'VGPUs'),
    }
  },

  // -----------------------------------------------------------------

  vtpm(obj) {
    return {
      type: 'VTPM',

      vm: link(obj, 'VM'),
    }
  },

  // -----------------------------------------------------------------

  pusb(obj) {
    let description = obj.vendor_desc
    if (obj.product_desc.trim() !== '') {
      description += ` - ${obj.product_desc.trim()}`
    }
    return {
      type: 'PUSB',

      description,
      host: link(obj, 'host'),
      passthroughEnabled: obj.passthrough_enabled,
      speed: obj.speed,
      usbGroup: link(obj, 'USB_group'),
      vendorId: obj.vendor_id,
      version: obj.version,
    }
  },

  // -----------------------------------------------------------------

  vusb(obj) {
    return {
      type: 'VUSB',

      vm: link(obj, 'VM'),
      currentlyAttached: obj.currently_attached,
      usbGroup: link(obj, 'USB_group'),
    }
  },

  // -----------------------------------------------------------------

  usb_group(obj) {
    return {
      type: 'USB_group',

      PUSBs: link(obj, 'PUSBs'),
      VUSBs: link(obj, 'VUSBs'),
    }
  },

  // -----------------------------------------------------------------

  bond(obj) {
    return {
      type: 'bond',
      master: link(obj, 'master'),
      mode: obj.mode,
    }
  },
}

// ===================================================================

export default function xapiObjectToXo(xapiObj, dependents = {}) {
  const transform = TRANSFORMS[xapiObj.$type.toLowerCase()]
  if (!transform) {
    return
  }

  const xoObj = transform(xapiObj, dependents)
  if (!xoObj) {
    return
  }

  if (!('id' in xoObj)) {
    xoObj.id = xapiObj.$id
  }
  if (!('type' in xoObj)) {
    xoObj.type = xapiObj.$type
  }
  if ('uuid' in xapiObj && !('uuid' in xoObj)) {
    xoObj.uuid = xapiObj.uuid
  }
  xoObj.$pool = xapiObj.$pool.$id
  xoObj.$poolId = xoObj.$pool // TODO: deprecated, remove when no longer used in xo-web

  // Internal properties.
  defineProperties(xoObj, {
    _xapiId: {
      value: xapiObj.$id,
    },
    _xapiRef: {
      enumerable: true,
      value: xapiObj.$ref,
    },
  })

  // Freezes and returns the new object.
  return freeze(xoObj)
}
