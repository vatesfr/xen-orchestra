/* eslint-env jest */

import { map, size } from 'lodash'

// eslint-disable-next-line n/no-missing-import
import { almostEqual, config, waitObjectState, xo } from './../util'

// ===================================================================

beforeAll(async () => {
  jest.setTimeout(100e3)
})

describe('snapshotting', () => {
  let snapshotId
  let vmId

  // ----------------------------------------------------------------------

  beforeAll(async () => {
    vmId = await xo.call('vm.create', {
      name_label: 'vmTest',
      name_description: 'creating a vm',
      template: config.templatesId.centOS,
      VIFs: [{ network: config.labPoolNetworkId }, { network: config.labPoolNetworkId }],
      VDIs: [
        {
          device: '0',
          size: 1,
          SR: config.labPoolSrId,
          type: 'user',
        },
        {
          device: '1',
          size: 1,
          SR: config.labPoolSrId,
          type: 'user',
        },
        {
          device: '2',
          size: 1,
          SR: config.labPoolSrId,
          type: 'user',
        },
      ],
    })
    await waitObjectState(xo, vmId, vm => {
      if (vm.type !== 'VM') throw new Error('retry')
    })
  })

  afterAll(() => xo.call('vm.delete', { id: vmId, delete_disks: true }))

  // =================================================================

  describe('.snapshot()', () => {
    let $vm

    it('snapshots a VM', async () => {
      snapshotId = await xo.call('vm.snapshot', {
        id: vmId,
        name: 'snapshot',
      })

      const [, snapshot] = await Promise.all([
        waitObjectState(xo, vmId, vm => {
          $vm = vm
          expect(vm.snapshots[0]).toBe(snapshotId)
        }),
        xo.getOrWaitObject(snapshotId),
      ])

      expect(snapshot.type).toBe('VM-snapshot')
      expect(snapshot.name_label).toBe('snapshot')
      expect(snapshot.$snapshot_of).toBe(vmId)

      almostEqual(snapshot, $vm, [
        '$snapshot_of',
        '$VBDs',
        'id',
        'installTime',
        'name_label',
        'snapshot_time',
        'snapshots',
        'type',
        'uuid',
        'VIFs',
      ])
    })
  })

  describe('.revert()', () => {
    let createdSnapshotId

    it('reverts a snapshot to its parent VM', async () => {
      await xo.call('vm.set', {
        id: vmId,
        name_label: 'vmRenamed',
      })
      await waitObjectState(xo, vmId, vm => {
        if (vm.name_label !== 'vmRenamed') throw new Error('retry')
      })

      await xo.call('vm.revert', { id: snapshotId })

      await waitObjectState(xo, vmId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.name_label).toBe('vmTest')
        expect(size(vm.snapshots)).toBe(2)
        map(vm.snapshots, snapshot => {
          if (snapshot !== snapshotId) createdSnapshotId = snapshot
        })
      })

      const createdSnapshot = await xo.getOrWaitObject(createdSnapshotId)
      expect(createdSnapshot.name_label).toBe('vmRenamed')
    })
  })
})
