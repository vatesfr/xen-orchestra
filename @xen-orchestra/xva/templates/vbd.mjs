export const DEFAULT_VBD = {
  class: 'VBD',
  snapshot: {
    allowed_operations: [],
    bootable: true, // @todo : fix it
    current_operations: {},
    currently_attached: false,
    empty: false,
    metrics: 'OpaqueRef:NULL',
    mode: 'RW',
    other_config: {},
    qos_algorithm_params: {},
    qos_algorithm_type: '',
    qos_supported_algorithms: [],
    runtime_properties: {},
    status_code: 0,
    status_detail: '',
    storage_lock: false,
    type: 'Disk',
    unpluggable: false,
  },
}
