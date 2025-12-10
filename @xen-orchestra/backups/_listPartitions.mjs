import fromCallback from 'promise-toolbox/fromCallback'
import { createLogger } from '@xen-orchestra/log'
import { createParser } from 'parse-pairs'
import { execFile } from 'child_process'

const { debug } = createLogger('xo:backups:listPartitions')

const IGNORED_PARTITION_TYPES = {
  // https://github.com/jhermsmeier/node-mbr/blob/master/lib/partition.js#L38
  0x05: true,
  0x0f: true,
  0x15: true,
  0x5e: true,
  0x5f: true,
  0x85: true,
  0x91: true,
  0x9b: true,
  0xc5: true,
  0xcf: true,
  0xd5: true,

  0x82: true, // swap
  // GPT Linux swap GUID
  '0657fd6d-a4ab-43c4-84e5-0933c84b4f4f': true,
}

// MBR LVM type
export const LVM_PARTITION_TYPE_MBR = 0x8e
// GPT LVM type
export const LVM_PARTITION_TYPE_GPT = 'e6d6d379-f507-44c2-a23c-238f2a3df928'

const parsePartxLine = createParser({
  keyTransform: key => (key === 'UUID' ? 'id' : key.toLowerCase()),
  valueTransform: (value, key) => {
    if (key === 'start' || key === 'size') {
      return +value
    }
    // For GPT partitions, type is a UUID string
    if (key === 'type' && !value.startsWith('0x')) {
      return value.toLowerCase()
    }
    // For MBR partitions, type is a hex number as string (e.g., "0x8e")
    if (key === 'type' && value.startsWith('0x')) {
      return parseInt(value, 16)
    }
    return value
  },
})

// returns an empty array in case of a non-partitioned disk
export async function listPartitions(devicePath) {
  const parts = await fromCallback(execFile, 'partx', [
    '--bytes',
    '--output=NR,START,SIZE,NAME,UUID,TYPE',
    '--pairs',
    devicePath,
  ]).catch(error => {
    // partx returns 1 since v2.33 when failing to read partitions.
    //
    // Prior versions are correctly handled by the nominal case.
    debug('listPartitions', { error })
    return ''
  })

  return parts
    .split(/\r?\n/)
    .map(parsePartxLine)
    .filter(({ type }) => type != null && !(type in IGNORED_PARTITION_TYPES))
}
