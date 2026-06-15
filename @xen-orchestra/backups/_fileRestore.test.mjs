import { strict as assert } from 'node:assert'
import test from 'node:test'

import { isLvmPartitionType, isProbeableForLvm, lvmOnlyDevice, toLvPartitions } from './_fileRestore.mjs'
import {
  LINUX_DATA_PARTITION_TYPE_GPT,
  LINUX_DATA_PARTITION_TYPE_MBR,
  LVM_PARTITION_TYPE_GPT,
  LVM_PARTITION_TYPE_MBR,
} from './_listPartitions.mjs'

// well-known GPT type GUIDs that must NOT be probed/treated as LVM
const EFI = 'c12a7328-f81f-11d2-ba4b-00a0c93ec93b'
const BIOS_BOOT = '21686148-6449-6e6f-744e-656564454649'
const SWAP = '0657fd6d-a4ab-43c4-84e5-0933c84b4f4f'

test('lvmOnlyDevice builds an accept-only global_filter for the device', () => {
  assert.equal(
    lvmOnlyDevice('/dev/mapper/xo-pv-abcd1234'),
    'devices { global_filter=[ "a|^/dev/mapper/xo-pv-abcd1234$|", "r|.*|" ] }'
  )
  assert.equal(lvmOnlyDevice('/dev/loop7'), 'devices { global_filter=[ "a|^/dev/loop7$|", "r|.*|" ] }')
})

test('isLvmPartitionType matches only the LVM partition types', () => {
  assert.equal(isLvmPartitionType(LVM_PARTITION_TYPE_MBR), true)
  assert.equal(isLvmPartitionType(LVM_PARTITION_TYPE_GPT), true)
  assert.equal(isLvmPartitionType(LINUX_DATA_PARTITION_TYPE_GPT), false)
  assert.equal(isLvmPartitionType(EFI), false)
  assert.equal(isLvmPartitionType(undefined), false)
})

test('isProbeableForLvm matches only generic Linux-data types', () => {
  assert.equal(isProbeableForLvm(LINUX_DATA_PARTITION_TYPE_MBR), true)
  assert.equal(isProbeableForLvm(LINUX_DATA_PARTITION_TYPE_GPT), true)
  // never probe these
  assert.equal(isProbeableForLvm(LVM_PARTITION_TYPE_GPT), false)
  assert.equal(isProbeableForLvm(BIOS_BOOT), false)
  assert.equal(isProbeableForLvm(EFI), false)
  assert.equal(isProbeableForLvm(SWAP), false)
  assert.equal(isProbeableForLvm(undefined), false)
})

test('toLvPartitions builds entries, skips unnamed LVs, shows the original VG name', () => {
  const lvItems = [
    { lv_name: 'ubuntu-lv', lv_path: '/dev/xohash/ubuntu-lv', lv_size: '1000', vg_name: 'xohash' },
    // a PV with no LV yields a row with an empty lv_name → must be skipped
    { lv_name: '', lv_path: '', lv_size: '0', vg_name: 'xohash' },
    { lv_name: 'swap_1', lv_path: '/dev/xohash/swap_1', lv_size: '500', vg_name: 'xohash' },
  ]
  assert.deepEqual(toLvPartitions('part3', 'ubuntu-vg', lvItems), [
    { id: 'part3/xohash/ubuntu-lv', name: 'ubuntu-vg/ubuntu-lv', size: '1000' },
    { id: 'part3/xohash/swap_1', name: 'ubuntu-vg/swap_1', size: '500' },
  ])
})

test('toLvPartitions falls back to the bare LV name when the original VG name is unknown', () => {
  const lvItems = [{ lv_name: 'data', lv_path: '/dev/xohash/data', lv_size: '42', vg_name: 'xohash' }]
  // raw-disk PV → empty partitionId
  assert.deepEqual(toLvPartitions('', undefined, lvItems), [{ id: '/xohash/data', name: 'data', size: '42' }])
})
