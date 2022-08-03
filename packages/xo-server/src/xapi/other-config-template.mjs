import { Ref } from 'xen-api'

const OTHER_CONFIG_TEMPLATE = {
  actions_after_crash: 'restart',
  actions_after_reboot: 'restart',
  actions_after_shutdown: 'destroy',
  blocked_operations: {},
  ha_always_run: false,
  HVM_boot_params: {
    order: 'cdn',
  },
  HVM_boot_policy: 'BIOS order',
  HVM_shadow_multiplier: 1,
  is_a_template: false,
  memory_dynamic_max: 4294967296,
  memory_dynamic_min: 4294967296,
  memory_static_max: 4294967296,
  memory_static_min: 134217728,
  order: 0,
  other_config: {
    vgpu_pci: '',
    base_template_name: 'Other install media',
    'install-methods': 'cdrom',

    // mac_seed should not be passed to VM.create so that a new one is generated
  },
  PCI_bus: '',
  platform: {
    timeoffset: '0',
    nx: 'true',
    acpi: '1',
    apic: 'true',
    pae: 'true',
    hpet: 'true',
    viridian: 'true',
  },
  protection_policy: Ref.EMPTY,
  PV_args: '',
  PV_bootloader: '',
  PV_bootloader_args: '',
  PV_kernel: '',
  PV_legacy_args: '',
  PV_ramdisk: '',
  recommendations:
    '<restrictions><restriction field="memory-static-max" max="137438953472" /><restriction field="vcpus-max" max="32" /><restriction property="number-of-vbds" max="255" /><restriction property="number-of-vifs" max="7" /><restriction field="has-vendor-device" value="false" /></restrictions>',
  shutdown_delay: 0,
  start_delay: 0,
  user_version: 1,
  VCPUs_at_startup: 1,
  VCPUs_max: 1,
  VCPUs_params: {},
  version: 0,
}
export { OTHER_CONFIG_TEMPLATE as default }
