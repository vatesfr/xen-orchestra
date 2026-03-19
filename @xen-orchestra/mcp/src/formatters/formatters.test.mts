import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatVmList, formatVmDetails } from './vm.mjs'
import { formatHostList } from './host.mjs'
import { formatPoolList, formatPoolDashboard } from './pool.mjs'
import { formatVdiList } from './storage.mjs'

describe('formatVmList', () => {
  it('returns message for empty list', () => {
    assert.strictEqual(formatVmList([]), 'No VMs found.')
  })

  it('formats VMs as markdown table', () => {
    const vms = [
      {
        id: 'vm1',
        name_label: 'Web Server',
        power_state: 'Running',
        CPUs: { number: 4 },
        memory: { size: 4294967296 },
      },
      { id: 'vm2', name_label: 'DB Server', power_state: 'Halted', CPUs: { number: 8 }, memory: { size: 17179869184 } },
    ]
    const result = formatVmList(vms)
    assert.ok(result.includes('## VMs (2 found)'))
    assert.ok(result.includes('Web Server'))
    assert.ok(result.includes('Running'))
    assert.ok(result.includes('4.0 GB'))
    assert.ok(result.includes('16.0 GB'))
    assert.ok(result.includes('| Name | State | vCPU | RAM | ID |'))
  })

  it('handles missing fields gracefully', () => {
    const vms = [{ id: 'vm1' }]
    const result = formatVmList(vms)
    assert.ok(result.includes('## VMs (1 found)'))
    assert.ok(result.includes('- |'))
  })
})

describe('formatVmDetails', () => {
  it('formats VM details with all fields', () => {
    const vm = {
      id: 'vm1',
      name_label: 'Prod Web',
      power_state: 'Running',
      CPUs: { number: 4 },
      memory: { size: 8589934592 },
      $container: 'host-1',
      mainIpAddress: '10.0.0.5',
      tags: ['production', 'web'],
    }
    const result = formatVmDetails(vm)
    assert.ok(result.includes('## VM: Prod Web'))
    assert.ok(result.includes('**State**: Running'))
    assert.ok(result.includes('**vCPUs**: 4'))
    assert.ok(result.includes('8.0 GB'))
    assert.ok(result.includes('**Host/Pool**: host-1'))
    assert.ok(result.includes('**IP**: 10.0.0.5'))
    assert.ok(result.includes('production, web'))
  })

  it('omits optional fields when absent', () => {
    const vm = { id: 'vm1', name_label: 'Simple', power_state: 'Halted' }
    const result = formatVmDetails(vm)
    assert.ok(!result.includes('**Host/Pool**'))
    assert.ok(!result.includes('**IP**'))
    assert.ok(!result.includes('**Tags**'))
  })
})

describe('formatHostList', () => {
  it('returns message for empty list', () => {
    assert.strictEqual(formatHostList([]), 'No hosts found.')
  })

  it('formats hosts as markdown table', () => {
    const hosts = [{ id: 'h1', name_label: 'Host A', power_state: 'Running', productBrand: 'XCP-ng', version: '8.3' }]
    const result = formatHostList(hosts)
    assert.ok(result.includes('## Hosts (1 found)'))
    assert.ok(result.includes('Host A'))
    assert.ok(result.includes('XCP-ng'))
    assert.ok(result.includes('8.3'))
  })
})

describe('formatPoolList', () => {
  it('returns message for empty list', () => {
    assert.strictEqual(formatPoolList([]), 'No pools found.')
  })

  it('formats pools as markdown table', () => {
    const pools = [
      { id: 'p1', name_label: 'Production', HA_enabled: true, auto_poweron: false, name_description: 'Main pool' },
    ]
    const result = formatPoolList(pools)
    assert.ok(result.includes('## Pools (1 found)'))
    assert.ok(result.includes('Production'))
    assert.ok(result.includes('Yes'))
    assert.ok(result.includes('Main pool'))
  })
})

describe('formatPoolDashboard', () => {
  it('formats dashboard with all sections', () => {
    const dashboard = {
      hosts: {
        status: { running: 3, halted: 1, total: 4 },
        topFiveUsage: {
          ram: [{ id: 'h1', name_label: 'Host A', size: 34359738368, usage: 28851400704, percent: 84.0 }],
          cpu: [{ id: 'h1', name_label: 'Host A', percent: 18.4 }],
        },
      },
      vms: { status: { running: 10, halted: 5, total: 15 } },
      alarms: ['alarm-id-1', 'alarm-id-2'],
    }
    const result = formatPoolDashboard(dashboard)
    assert.ok(result.includes('## Pool Dashboard'))
    assert.ok(result.includes('### Hosts'))
    assert.ok(result.includes('**running**: 3'))
    assert.ok(result.includes('### Top RAM Usage'))
    assert.ok(result.includes('Host A'))
    assert.ok(result.includes('84.0%'))
    assert.ok(result.includes('### Top CPU Usage'))
    assert.ok(result.includes('### VMs'))
    assert.ok(result.includes('**running**: 10'))
    assert.ok(result.includes('### Alarms: 2 active'))
  })

  it('handles empty dashboard', () => {
    const result = formatPoolDashboard({})
    assert.ok(result.includes('## Pool Dashboard'))
    assert.ok(!result.includes('### Hosts'))
  })
})

describe('formatVdiList', () => {
  it('returns message for empty list', () => {
    assert.strictEqual(formatVdiList([]), 'No VDIs found.')
  })

  it('formats VDIs as markdown table', () => {
    const vdis = [
      { id: 'vdi1', name_label: 'System Disk', size: 53687091200, usage: 21474836480, VDI_type: 'User', $SR: 'sr1' },
    ]
    const result = formatVdiList(vdis)
    assert.ok(result.includes('## VDIs (1 found)'))
    assert.ok(result.includes('System Disk'))
    assert.ok(result.includes('50.0 GB'))
    assert.ok(result.includes('20.0 GB'))
    assert.ok(result.includes('User'))
  })
})
