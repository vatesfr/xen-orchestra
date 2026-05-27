/**
 * Tests for OpenMetrics Formatter — Entity Formatters
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatHostStatusMetrics,
  formatHostUptimeMetrics,
  formatSrMetrics,
  formatVdiMetrics,
  formatVmStatusMetrics,
  formatVmUptimeMetrics,
} from './entity-formatters.mjs'
import { formatToOpenMetrics, type LabelContext } from './primitives.mjs'

import type { HostStatusItem, SrDataItem, VdiDataItem, VmStatusItem } from '../types/domain.mjs'

// ============================================================================
// formatHostStatusMetrics Tests
// ============================================================================

describe('formatHostStatusMetrics', () => {
  it('should return empty array for empty input', () => {
    const result = formatHostStatusMetrics([])
    assert.deepEqual(result, [])
  })

  it('should create one metric per host with value 1', () => {
    const hosts: HostStatusItem[] = [
      {
        uuid: 'host-1',
        name_label: 'Host 1',
        power_state: 'Running',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'host-2',
        name_label: 'Host 2',
        power_state: 'Halted',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const result = formatHostStatusMetrics(hosts)

    assert.equal(result.length, 2)
    assert.equal(result[0]!.value, 1)
    assert.equal(result[1]!.value, 1)
  })

  it('should set correct metric name and type', () => {
    const hosts: HostStatusItem[] = [
      {
        uuid: 'host-1',
        name_label: 'Host 1',
        power_state: 'Running',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const result = formatHostStatusMetrics(hosts)

    assert.equal(result[0]!.name, 'xcp_host_status')
    assert.equal(result[0]!.type, 'gauge')
  })

  it('should include all expected labels', () => {
    const hosts: HostStatusItem[] = [
      {
        uuid: 'host-1',
        name_label: 'Host 1',
        power_state: 'Running',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Production',
      },
    ]

    const result = formatHostStatusMetrics(hosts)
    const labels = result[0]!.labels

    assert.equal(labels.pool_id, 'pool-1')
    assert.equal(labels.pool_name, 'Production')
    assert.equal(labels.uuid, 'host-1')
    assert.equal(labels.host_name, 'Host 1')
    assert.equal(labels.power_state, 'Running')
    assert.equal(labels.enabled, 'true')
  })

  it('should omit pool_name when empty', () => {
    const hosts: HostStatusItem[] = [
      { uuid: 'host-1', name_label: 'Host 1', power_state: 'Unknown', enabled: true, pool_id: 'pool-1', pool_name: '' },
    ]

    const result = formatHostStatusMetrics(hosts)

    assert.equal(result[0]!.labels.pool_name, undefined)
  })

  it('should handle all power_state values and enabled flag', () => {
    const hosts: HostStatusItem[] = [
      {
        uuid: 'host-0',
        name_label: 'Host 0',
        power_state: 'Running',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'host-1',
        name_label: 'Host 1',
        power_state: 'Running',
        enabled: false,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'host-2',
        name_label: 'Host 2',
        power_state: 'Halted',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'host-3',
        name_label: 'Host 3',
        power_state: 'Unknown',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const result = formatHostStatusMetrics(hosts)

    assert.equal(result.length, 4)
    assert.equal(result[0]!.labels.power_state, 'Running')
    assert.equal(result[0]!.labels.enabled, 'true')
    assert.equal(result[1]!.labels.power_state, 'Running')
    assert.equal(result[1]!.labels.enabled, 'false')
    assert.equal(result[2]!.labels.power_state, 'Halted')
    assert.equal(result[3]!.labels.power_state, 'Unknown')
  })

  it('should produce valid OpenMetrics output', () => {
    const hosts: HostStatusItem[] = [
      {
        uuid: 'host-1',
        name_label: 'Host 1',
        power_state: 'Running',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'host-2',
        name_label: 'Host 2',
        power_state: 'Halted',
        enabled: false,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const metrics = formatHostStatusMetrics(hosts)
    const output = formatToOpenMetrics(metrics)

    assert.ok(output.includes('# HELP xcp_host_status Host status (1 = current state)'))
    assert.ok(output.includes('# TYPE xcp_host_status gauge'))
    assert.ok(output.includes('power_state="Running"'))
    assert.ok(output.includes('enabled="false"'))

    // HELP and TYPE should appear only once
    const helpCount = (output.match(/# HELP xcp_host_status/g) || []).length
    assert.equal(helpCount, 1)
  })

  it('should escape special characters in host names', () => {
    const hosts: HostStatusItem[] = [
      {
        uuid: 'host-1',
        name_label: 'Host "with quotes"',
        power_state: 'Running',
        enabled: true,
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const metrics = formatHostStatusMetrics(hosts)
    const output = formatToOpenMetrics(metrics)

    assert.ok(output.includes('host_name="Host \\"with quotes\\""'))
  })
})

// ============================================================================
// Host Uptime Metrics Tests
// ============================================================================

describe('formatHostUptimeMetrics', () => {
  const createLabelContextWithUptime = (startTime: number | null): LabelContext => ({
    hosts: [
      {
        hostId: 'host-uuid-123',
        hostAddress: '192.168.1.1',
        hostLabel: 'Host 1',
        poolId: 'pool-456',
        poolLabel: 'Production Pool',
        sessionId: 'session-123',
        protocol: 'https:',
      },
    ],
    labels: {
      vms: {},
      hosts: {
        'host-uuid-123': {
          name_label: 'Host 1',
          pifDeviceToNetworkName: {},
          startTime,
        },
      },
      srs: {},
      srTruncatedToUuid: {},
      vdiUuidToSrUuid: {},
    },
  })

  it('should generate uptime metric for host with valid startTime', () => {
    const now = Math.floor(Date.now() / 1000)
    const bootTime = now - 3600 // 1 hour ago
    const labelContext = createLabelContextWithUptime(bootTime)

    const metrics = formatHostUptimeMetrics(labelContext)

    assert.equal(metrics.length, 1)
    const metric = metrics[0]!
    assert.equal(metric.name, 'xcp_host_uptime_seconds')
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.help, 'Host uptime in seconds since boot')
    assert.equal(metric.labels.pool_id, 'pool-456')
    assert.equal(metric.labels.pool_name, 'Production Pool')
    assert.equal(metric.labels.uuid, 'host-uuid-123')
    assert.equal(metric.labels.host_name, 'Host 1')
    // Value should be approximately 3600 (1 hour)
    assert.ok(metric.value >= 3599 && metric.value <= 3601)
  })

  it('should skip host with null startTime', () => {
    const labelContext = createLabelContextWithUptime(null)

    const metrics = formatHostUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })

  it('should skip host not found in labels', () => {
    const labelContext: LabelContext = {
      hosts: [
        {
          hostId: 'unknown-host',
          hostAddress: '192.168.1.1',
          hostLabel: 'Unknown Host',
          poolId: 'pool-456',
          poolLabel: 'Production',
          sessionId: 'session-123',
          protocol: 'https:',
        },
      ],
      labels: {
        vms: {},
        hosts: {},
        srs: {},
        srTruncatedToUuid: {},
        vdiUuidToSrUuid: {},
      },
    }

    const metrics = formatHostUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })

  it('should generate metrics for multiple hosts', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext: LabelContext = {
      hosts: [
        {
          hostId: 'host-1',
          hostAddress: '192.168.1.1',
          hostLabel: 'Host 1',
          poolId: 'pool-1',
          poolLabel: 'Pool A',
          sessionId: 'session-1',
          protocol: 'https:',
        },
        {
          hostId: 'host-2',
          hostAddress: '192.168.1.2',
          hostLabel: 'Host 2',
          poolId: 'pool-1',
          poolLabel: 'Pool A',
          sessionId: 'session-1',
          protocol: 'https:',
        },
      ],
      labels: {
        vms: {},
        hosts: {
          'host-1': {
            name_label: 'Host 1',
            pifDeviceToNetworkName: {},
            startTime: now - 7200, // 2 hours
          },
          'host-2': {
            name_label: 'Host 2',
            pifDeviceToNetworkName: {},
            startTime: now - 1800, // 30 minutes
          },
        },
        srs: {},
        srTruncatedToUuid: {},
        vdiUuidToSrUuid: {},
      },
    }

    const metrics = formatHostUptimeMetrics(labelContext)

    assert.equal(metrics.length, 2)
    const host1Metric = metrics.find(m => m.labels.uuid === 'host-1')
    const host2Metric = metrics.find(m => m.labels.uuid === 'host-2')
    assert.ok(host1Metric)
    assert.ok(host2Metric)
    assert.ok(host1Metric.value >= 7199 && host1Metric.value <= 7201)
    assert.ok(host2Metric.value >= 1799 && host2Metric.value <= 1801)
  })

  it('should omit pool_name label when empty', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext: LabelContext = {
      hosts: [
        {
          hostId: 'host-1',
          hostAddress: '192.168.1.1',
          hostLabel: 'Host 1',
          poolId: 'pool-1',
          poolLabel: '', // Empty pool label
          sessionId: 'session-1',
          protocol: 'https:',
        },
      ],
      labels: {
        vms: {},
        hosts: {
          'host-1': {
            name_label: 'Host 1',
            pifDeviceToNetworkName: {},
            startTime: now - 3600,
          },
        },
        srs: {},
        srTruncatedToUuid: {},
        vdiUuidToSrUuid: {},
      },
    }

    const metrics = formatHostUptimeMetrics(labelContext)

    assert.equal(metrics.length, 1)
    assert.equal(metrics[0]!.labels.pool_name, undefined)
  })

  it('should omit host_name label when empty', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext: LabelContext = {
      hosts: [
        {
          hostId: 'host-1',
          hostAddress: '192.168.1.1',
          hostLabel: 'Host 1',
          poolId: 'pool-1',
          poolLabel: 'Pool A',
          sessionId: 'session-1',
          protocol: 'https:',
        },
      ],
      labels: {
        vms: {},
        hosts: {
          'host-1': {
            name_label: '', // Empty host name
            pifDeviceToNetworkName: {},
            startTime: now - 3600,
          },
        },
        srs: {},
        srTruncatedToUuid: {},
        vdiUuidToSrUuid: {},
      },
    }

    const metrics = formatHostUptimeMetrics(labelContext)

    assert.equal(metrics.length, 1)
    assert.equal(metrics[0]!.labels.host_name, undefined)
  })
})

// ============================================================================
// SR Metrics Tests
// ============================================================================

describe('formatSrMetrics', () => {
  const createSrDataItem = (overrides: Partial<SrDataItem> = {}): SrDataItem => ({
    uuid: 'sr-uuid-456',
    name_label: 'Local Storage',
    size: 1_000_000_000_000,
    physical_usage: 250_000_000_000,
    usage: 500_000_000_000,
    pool_id: 'pool-789',
    pool_name: 'Production Pool',
    sr_type: 'lvm',
    ...overrides,
  })

  it('should emit 3 metrics per SR with sr_type label when present', () => {
    const metrics = formatSrMetrics([createSrDataItem({ sr_type: 'linstor' })])

    assert.equal(metrics.length, 3)
    for (const m of metrics) {
      assert.equal(m.labels.sr_type, 'linstor')
    }
  })

  it('should omit sr_type label when empty', () => {
    const metrics = formatSrMetrics([createSrDataItem({ sr_type: '' })])

    assert.equal(metrics.length, 3)
    for (const m of metrics) {
      assert.equal(m.labels.sr_type, undefined)
    }
  })

  it('should distinguish multiple SRs by sr_type label', () => {
    const metrics = formatSrMetrics([
      createSrDataItem({ uuid: 'sr-a', sr_type: 'linstor' }),
      createSrDataItem({ uuid: 'sr-b', sr_type: 'lvm' }),
    ])

    const typesByUuid = new Map<string, string>()
    for (const m of metrics) {
      const srUuid = m.labels.sr_uuid
      const srType = m.labels.sr_type
      if (srUuid !== undefined && srType !== undefined) {
        typesByUuid.set(srUuid, srType)
      }
    }
    assert.equal(typesByUuid.get('sr-a'), 'linstor')
    assert.equal(typesByUuid.get('sr-b'), 'lvm')
  })

  it('should round-trip sr_type through formatToOpenMetrics', () => {
    const metrics = formatSrMetrics([createSrDataItem({ sr_type: 'linstor' })])
    const output = formatToOpenMetrics(metrics)
    assert.match(output, /sr_type="linstor"/)
  })
})

// ============================================================================
// VDI Metrics Tests
// ============================================================================

describe('formatVdiMetrics', () => {
  const createVdiDataItem = (overrides: Partial<VdiDataItem> = {}): VdiDataItem => ({
    uuid: 'vdi-uuid-123',
    name_label: 'System Disk',
    size: 107374182400, // 100 GiB
    usage: 53687091200, // 50 GiB
    sr_uuid: 'sr-uuid-456',
    sr_name: 'Local Storage',
    sr_type: 'lvm',
    pool_id: 'pool-789',
    pool_name: 'Production Pool',
    ...overrides,
  })

  it('should generate 2 metrics per VDI with all labels when attached to a VM', () => {
    const vdiData: VdiDataItem[] = [
      createVdiDataItem({
        vm_uuid: 'vm-uuid-abc',
        vm_name: 'My VM',
      }),
    ]

    const metrics = formatVdiMetrics(vdiData)

    assert.equal(metrics.length, 2)

    // Virtual size metric
    const virtualSize = metrics[0]!
    assert.equal(virtualSize.name, 'xcp_vdi_virtual_size_bytes')
    assert.equal(virtualSize.type, 'gauge')
    assert.equal(virtualSize.help, 'VDI virtual size in bytes')
    assert.equal(virtualSize.value, 107374182400)
    assert.equal(virtualSize.labels.pool_id, 'pool-789')
    assert.equal(virtualSize.labels.pool_name, 'Production Pool')
    assert.equal(virtualSize.labels.sr_uuid, 'sr-uuid-456')
    assert.equal(virtualSize.labels.sr_name, 'Local Storage')
    assert.equal(virtualSize.labels.vdi_uuid, 'vdi-uuid-123')
    assert.equal(virtualSize.labels.vdi_name, 'System Disk')
    assert.equal(virtualSize.labels.vm_uuid, 'vm-uuid-abc')
    assert.equal(virtualSize.labels.vm_name, 'My VM')

    // Physical usage metric
    const physicalUsage = metrics[1]!
    assert.equal(physicalUsage.name, 'xcp_vdi_physical_usage_bytes')
    assert.equal(physicalUsage.type, 'gauge')
    assert.equal(physicalUsage.help, 'VDI physical space used in bytes (allocated on SR)')
    assert.equal(physicalUsage.value, 53687091200)
    assert.equal(physicalUsage.labels.vm_uuid, 'vm-uuid-abc')
    assert.equal(physicalUsage.labels.vm_name, 'My VM')
  })

  it('should omit vm labels when VDI is not attached to a VM', () => {
    const vdiData: VdiDataItem[] = [createVdiDataItem()]

    const metrics = formatVdiMetrics(vdiData)

    assert.equal(metrics.length, 2)
    assert.equal(metrics[0]!.labels.vm_uuid, undefined)
    assert.equal(metrics[0]!.labels.vm_name, undefined)
    assert.equal(metrics[1]!.labels.vm_uuid, undefined)
    assert.equal(metrics[1]!.labels.vm_name, undefined)
  })

  it('should return empty array for empty input', () => {
    const metrics = formatVdiMetrics([])

    assert.equal(metrics.length, 0)
  })

  it('should generate correct number of metrics for multiple VDIs', () => {
    const vdiData: VdiDataItem[] = [
      createVdiDataItem({ uuid: 'vdi-1', name_label: 'Disk 1' }),
      createVdiDataItem({ uuid: 'vdi-2', name_label: 'Disk 2' }),
      createVdiDataItem({ uuid: 'vdi-3', name_label: 'Disk 3' }),
    ]

    const metrics = formatVdiMetrics(vdiData)

    assert.equal(metrics.length, 6) // 2 metrics * 3 VDIs
  })

  it('should map size to virtual_size_bytes and usage to physical_usage_bytes', () => {
    const vdiData: VdiDataItem[] = [
      createVdiDataItem({
        size: 1000,
        usage: 500,
      }),
    ]

    const metrics = formatVdiMetrics(vdiData)

    const virtualSize = metrics.find(m => m.name === 'xcp_vdi_virtual_size_bytes')!
    const physicalUsage = metrics.find(m => m.name === 'xcp_vdi_physical_usage_bytes')!

    assert.equal(virtualSize.value, 1000)
    assert.equal(physicalUsage.value, 500)
  })

  it('should omit pool_name label when pool_name is empty', () => {
    const vdiData: VdiDataItem[] = [createVdiDataItem({ pool_name: '' })]

    const metrics = formatVdiMetrics(vdiData)

    assert.equal(metrics[0]!.labels.pool_name, undefined)
  })

  it('should propagate sr_type label when present', () => {
    const vdiData: VdiDataItem[] = [createVdiDataItem({ sr_type: 'linstor' })]

    const metrics = formatVdiMetrics(vdiData)

    assert.equal(metrics.length, 2)
    for (const m of metrics) {
      assert.equal(m.labels.sr_type, 'linstor')
    }
  })

  it('should omit sr_type label when empty', () => {
    const vdiData: VdiDataItem[] = [createVdiDataItem({ sr_type: '' })]

    const metrics = formatVdiMetrics(vdiData)

    for (const m of metrics) {
      assert.equal(m.labels.sr_type, undefined)
    }
  })

  it('should produce valid OpenMetrics output', () => {
    const vdiData: VdiDataItem[] = [
      createVdiDataItem({
        vm_uuid: 'vm-uuid-abc',
        vm_name: 'My VM',
      }),
    ]

    const metrics = formatVdiMetrics(vdiData)
    const output = formatToOpenMetrics(metrics)

    assert.ok(output.includes('xcp_vdi_virtual_size_bytes'))
    assert.ok(output.includes('xcp_vdi_physical_usage_bytes'))
    assert.ok(output.includes('vdi_uuid="vdi-uuid-123"'))
    assert.ok(output.includes('vm_uuid="vm-uuid-abc"'))
  })

  it('should escape special characters in label values', () => {
    const vdiData: VdiDataItem[] = [
      createVdiDataItem({
        name_label: 'Disk "with quotes"',
      }),
    ]

    const metrics = formatVdiMetrics(vdiData)
    const output = formatToOpenMetrics(metrics)

    assert.ok(output.includes('vdi_name="Disk \\"with quotes\\""'))
  })
})

// ============================================================================
// formatVmStatusMetrics Tests
// ============================================================================

describe('formatVmStatusMetrics', () => {
  it('should return empty array for empty input', () => {
    const result = formatVmStatusMetrics([])
    assert.deepEqual(result, [])
  })

  it('should create one metric per VM with value 1', () => {
    const vms: VmStatusItem[] = [
      {
        uuid: 'vm-1',
        name_label: 'VM 1',
        power_state: 'Running',
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'vm-2',
        name_label: 'VM 2',
        power_state: 'Halted',
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const result = formatVmStatusMetrics(vms)

    assert.equal(result.length, 2)
    assert.equal(result[0]!.value, 1)
    assert.equal(result[1]!.value, 1)
  })

  it('should set correct metric name and type', () => {
    const vms: VmStatusItem[] = [
      {
        uuid: 'vm-1',
        name_label: 'VM 1',
        power_state: 'Running',
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const result = formatVmStatusMetrics(vms)

    assert.equal(result[0]!.name, 'xcp_vm_status')
    assert.equal(result[0]!.type, 'gauge')
  })

  it('should include all expected labels', () => {
    const vms: VmStatusItem[] = [
      {
        uuid: 'vm-1',
        name_label: 'VM 1',
        power_state: 'Running',
        pool_id: 'pool-1',
        pool_name: 'Production',
      },
    ]

    const result = formatVmStatusMetrics(vms)
    const labels = result[0]!.labels

    assert.equal(labels.pool_id, 'pool-1')
    assert.equal(labels.pool_name, 'Production')
    assert.equal(labels.uuid, 'vm-1')
    assert.equal(labels.vm_name, 'VM 1')
    assert.equal(labels.power_state, 'Running')
  })

  it('should omit pool_name when empty', () => {
    const vms: VmStatusItem[] = [
      { uuid: 'vm-1', name_label: 'VM 1', power_state: 'Running', pool_id: 'pool-1', pool_name: '' },
    ]

    const result = formatVmStatusMetrics(vms)

    assert.equal(result[0]!.labels.pool_name, undefined)
  })

  it('should handle all VM power_state values', () => {
    const vms: VmStatusItem[] = [
      { uuid: 'vm-0', name_label: 'VM 0', power_state: 'Running', pool_id: 'pool-1', pool_name: 'Pool' },
      { uuid: 'vm-1', name_label: 'VM 1', power_state: 'Paused', pool_id: 'pool-1', pool_name: 'Pool' },
      { uuid: 'vm-2', name_label: 'VM 2', power_state: 'Halted', pool_id: 'pool-1', pool_name: 'Pool' },
      { uuid: 'vm-3', name_label: 'VM 3', power_state: 'Suspended', pool_id: 'pool-1', pool_name: 'Pool' },
    ]

    const result = formatVmStatusMetrics(vms)

    assert.equal(result.length, 4)
    assert.equal(result[0]!.labels.power_state, 'Running')
    assert.equal(result[1]!.labels.power_state, 'Paused')
    assert.equal(result[2]!.labels.power_state, 'Halted')
    assert.equal(result[3]!.labels.power_state, 'Suspended')
  })

  it('should produce valid OpenMetrics output', () => {
    const vms: VmStatusItem[] = [
      {
        uuid: 'vm-1',
        name_label: 'VM 1',
        power_state: 'Running',
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
      {
        uuid: 'vm-2',
        name_label: 'VM 2',
        power_state: 'Halted',
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const metrics = formatVmStatusMetrics(vms)
    const output = formatToOpenMetrics(metrics)

    assert.ok(
      output.includes(
        '# HELP xcp_vm_status VM power state indicator (always 1; current state is carried by the power_state label)'
      )
    )
    assert.ok(output.includes('# TYPE xcp_vm_status gauge'))
    assert.ok(output.includes('power_state="Running"'))
    assert.ok(output.includes('power_state="Halted"'))

    // HELP and TYPE should appear only once
    const helpCount = (output.match(/# HELP xcp_vm_status/g) || []).length
    const typeCount = (output.match(/# TYPE xcp_vm_status/g) || []).length
    assert.equal(helpCount, 1)
    assert.equal(typeCount, 1)
  })

  it('should escape special characters in VM names', () => {
    const vms: VmStatusItem[] = [
      {
        uuid: 'vm-1',
        name_label: 'VM "with quotes"',
        power_state: 'Running',
        pool_id: 'pool-1',
        pool_name: 'Pool',
      },
    ]

    const metrics = formatVmStatusMetrics(vms)
    const output = formatToOpenMetrics(metrics)

    assert.ok(output.includes('vm_name="VM \\"with quotes\\""'))
  })

  it('should omit vm_name when empty', () => {
    const vms: VmStatusItem[] = [
      { uuid: 'vm-1', name_label: '', power_state: 'Running', pool_id: 'pool-1', pool_name: 'Pool' },
    ]

    const result = formatVmStatusMetrics(vms)

    assert.equal(result[0]!.labels.vm_name, undefined)
  })
})

// ============================================================================
// formatVmUptimeMetrics Tests
// ============================================================================

describe('formatVmUptimeMetrics', () => {
  const createVmLabelContext = (
    overrides: Partial<{
      startTime: number | null
      is_control_domain: boolean
      name_label: string
      pool_name: string
      power_state: string
    }> = {}
  ): LabelContext => ({
    hosts: [
      {
        hostId: 'host-1',
        hostAddress: '192.168.1.1',
        hostLabel: 'Host 1',
        poolId: 'pool-456',
        poolLabel: 'Production Pool',
        sessionId: 'session-123',
        protocol: 'https:',
      },
    ],
    labels: {
      vms: {
        'vm-uuid-123': {
          name_label: overrides.name_label ?? 'Test VM',
          is_control_domain: overrides.is_control_domain ?? false,
          vbdDeviceToVdiName: {},
          vbdDeviceToVdiUuid: {},
          vifIndexToNetworkName: {},
          startTime: overrides.startTime !== undefined ? overrides.startTime : Math.floor(Date.now() / 1000) - 3600,
          power_state: overrides.power_state ?? 'Running',
          pool_id: 'pool-456',
          pool_name: overrides.pool_name ?? 'Production Pool',
        },
      },
      hosts: {
        'host-1': {
          name_label: 'Host 1',
          pifDeviceToNetworkName: {},
          startTime: Math.floor(Date.now() / 1000) - 7200,
        },
      },
      srs: {},
      srTruncatedToUuid: {},
      vdiUuidToSrUuid: {},
    },
  })

  it('should generate uptime metric for VM with valid startTime', () => {
    const now = Math.floor(Date.now() / 1000)
    const bootTime = now - 3600 // 1 hour ago
    const labelContext = createVmLabelContext({ startTime: bootTime })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 1)
    const metric = metrics[0]!
    assert.equal(metric.name, 'xcp_vm_uptime_seconds')
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.help, 'VM uptime in seconds since boot')
    assert.equal(metric.labels.pool_id, 'pool-456')
    assert.equal(metric.labels.pool_name, 'Production Pool')
    assert.equal(metric.labels.uuid, 'vm-uuid-123')
    assert.equal(metric.labels.vm_name, 'Test VM')
    // Value should be approximately 3600 (1 hour)
    assert.ok(metric.value >= 3599 && metric.value <= 3601)
  })

  it('should skip VM with null startTime', () => {
    const labelContext = createVmLabelContext({ startTime: null })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })

  it('should skip VM-controller (is_control_domain)', () => {
    const labelContext = createVmLabelContext({ is_control_domain: true })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })

  it('should generate metrics for multiple VMs', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext: LabelContext = {
      hosts: [
        {
          hostId: 'host-1',
          hostAddress: '192.168.1.1',
          hostLabel: 'Host 1',
          poolId: 'pool-1',
          poolLabel: 'Pool A',
          sessionId: 'session-1',
          protocol: 'https:',
        },
      ],
      labels: {
        vms: {
          'vm-1': {
            name_label: 'VM 1',
            is_control_domain: false,
            vbdDeviceToVdiName: {},
            vbdDeviceToVdiUuid: {},
            vifIndexToNetworkName: {},
            startTime: now - 7200, // 2 hours
            power_state: 'Running',
            pool_id: 'pool-1',
            pool_name: 'Pool A',
          },
          'vm-2': {
            name_label: 'VM 2',
            is_control_domain: false,
            vbdDeviceToVdiName: {},
            vbdDeviceToVdiUuid: {},
            vifIndexToNetworkName: {},
            startTime: now - 1800, // 30 minutes
            power_state: 'Running',
            pool_id: 'pool-1',
            pool_name: 'Pool A',
          },
        },
        hosts: {
          'host-1': {
            name_label: 'Host 1',
            pifDeviceToNetworkName: {},
            startTime: now - 86400,
          },
        },
        srs: {},
        srTruncatedToUuid: {},
        vdiUuidToSrUuid: {},
      },
    }

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 2)
    const vm1Metric = metrics.find(m => m.labels.uuid === 'vm-1')
    const vm2Metric = metrics.find(m => m.labels.uuid === 'vm-2')
    assert.ok(vm1Metric)
    assert.ok(vm2Metric)
    assert.ok(vm1Metric.value >= 7199 && vm1Metric.value <= 7201)
    assert.ok(vm2Metric.value >= 1799 && vm2Metric.value <= 1801)
  })

  it('should omit pool_name when empty', () => {
    const labelContext = createVmLabelContext({ pool_name: '' })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 1)
    assert.equal(metrics[0]!.labels.pool_name, undefined)
  })

  it('should omit vm_name when empty', () => {
    const labelContext = createVmLabelContext({ name_label: '' })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 1)
    assert.equal(metrics[0]!.labels.vm_name, undefined)
  })

  it('should skip halted VM with stale startTime', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext = createVmLabelContext({ startTime: now - 86400, power_state: 'Halted' })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })

  it('should skip suspended VM', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext = createVmLabelContext({ startTime: now - 3600, power_state: 'Suspended' })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })

  it('should skip paused VM', () => {
    const now = Math.floor(Date.now() / 1000)
    const labelContext = createVmLabelContext({ startTime: now - 3600, power_state: 'Paused' })

    const metrics = formatVmUptimeMetrics(labelContext)

    assert.equal(metrics.length, 0)
  })
})
