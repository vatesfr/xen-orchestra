/**
 * Unit tests for getLabelLookupData.
 *
 * Builds a fake `XoApp` whose `getObjects()` returns a flat object map (the
 * provider does a single-pass categorization by `type`), then asserts the
 * VM/host/SR label structures and the VDI→SR / SR-truncation indexes.
 *
 * `indexSrUuidTruncations` itself is covered separately via the re-export in
 * `openmetric-formatter.test.mts`.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { XoApp } from '@vates/types'

import { getLabelLookupData } from './label-lookup.mjs'

function fakeXoFromObjects(objects: Record<string, unknown>): XoApp {
  return {
    getObjects() {
      return objects
    },
  } as unknown as XoApp
}

describe('getLabelLookupData', () => {
  it('builds VM labels with VBD/VIF maps and pool name resolution', () => {
    const xo = fakeXoFromObjects({
      'pool-1': { id: 'pool-1', uuid: 'pool-1', name_label: 'Pool One', type: 'pool' },
      'net-1': { id: 'net-1', name_label: 'Management', type: 'network' },
      'vdi-1': { id: 'vdi-1', uuid: 'vdi-1', name_label: 'System Disk', $SR: 'sr-1', type: 'VDI' },
      'sr-1': { id: 'sr-1', uuid: 'sr-1', name_label: 'SR One', SR_type: 'nfs', type: 'SR' },
      'vbd-1': { id: 'vbd-1', VM: 'vm-1', VDI: 'vdi-1', device: 'xvda', type: 'VBD' },
      'vif-1': { id: 'vif-1', $VM: 'vm-1', $network: 'net-1', device: '0', type: 'VIF' },
      'vm-1': {
        id: 'vm-1',
        uuid: 'vm-uuid-1',
        name_label: 'VM One',
        power_state: 'Running',
        startTime: 1700000000,
        $poolId: 'pool-1',
        type: 'VM',
      },
    })

    const labels = getLabelLookupData(xo)

    assert.deepEqual(labels.vms['vm-uuid-1'], {
      name_label: 'VM One',
      is_control_domain: false,
      vbdDeviceToVdiName: { xvda: 'System Disk' },
      vbdDeviceToVdiUuid: { xvda: 'vdi-1' },
      vifIndexToNetworkName: { '0': 'Management' },
      startTime: 1700000000,
      power_state: 'Running',
      pool_id: 'pool-1',
      pool_name: 'Pool One',
    })
    // VDI → SR index
    assert.equal(labels.vdiUuidToSrUuid['vdi-1'], 'sr-1')
    // SR label + truncation index (8-char prefix of the 4-char uuid is skipped,
    // so for a real-length uuid we'd index; here just assert the SR label).
    assert.deepEqual(labels.srs['sr-1'], { name_label: 'SR One', SR_type: 'nfs' })
  })

  it('flags VM-controller as control domain', () => {
    const xo = fakeXoFromObjects({
      'pool-1': { id: 'pool-1', uuid: 'pool-1', name_label: 'Pool One', type: 'pool' },
      dom0: {
        id: 'dom0',
        uuid: 'dom0-uuid',
        name_label: 'Control domain',
        power_state: 'Running',
        startTime: null,
        $poolId: 'pool-1',
        type: 'VM-controller',
      },
    })

    const labels = getLabelLookupData(xo)

    assert.equal(labels.vms['dom0-uuid']!.is_control_domain, true)
  })

  it('builds host labels with PIF→network map and indexes SR uuid truncations', () => {
    const srUuid = 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33'
    const xo = fakeXoFromObjects({
      'net-1': { id: 'net-1', name_label: 'Management', type: 'network' },
      'pif-1': { id: 'pif-1', $host: 'host-1', $network: 'net-1', device: 'eth0', type: 'PIF' },
      'host-1': { id: 'host-1', uuid: 'host-uuid-1', name_label: 'Host One', startTime: 1699999999, type: 'host' },
      'sr-1': { id: srUuid, uuid: srUuid, name_label: 'SR One', SR_type: 'linstor', type: 'SR' },
    })

    const labels = getLabelLookupData(xo)

    assert.deepEqual(labels.hosts['host-uuid-1'], {
      name_label: 'Host One',
      pifDeviceToNetworkName: { eth0: 'Management' },
      startTime: 1699999999,
    })
    // 8-char prefix and suffix of the SR uuid both map back to the full uuid.
    assert.equal(labels.srTruncatedToUuid[srUuid.slice(0, 8)], srUuid)
    assert.equal(labels.srTruncatedToUuid[srUuid.slice(-8)], srUuid)
  })
})
