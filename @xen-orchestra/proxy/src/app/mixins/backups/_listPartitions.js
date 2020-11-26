import fromCallback from 'promise-toolbox/fromCallback'
import { createParser } from 'parse-pairs'
import { execFile } from 'child_process'

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
}

export const LVM_PARTITION_TYPE = 0x8e

const parsePartxLine = createParser({
  keyTransform: key => (key === 'UUID' ? 'id' : key.toLowerCase()),
  valueTransform: (value, key) => (key === 'start' || key === 'size' || key === 'type' ? +value : value),
})

export const listPartitions = async devicePath => {
  const parts = await fromCallback(execFile, 'partx', [
    '--bytes',
    '--output=NR,START,SIZE,NAME,UUID,TYPE',
    '--pairs',
    devicePath,
  ])

  return parts
    .split(/\r?\n/)
    .map(parsePartxLine)
    .filter(({ type }) => type != null && !(type in IGNORED_PARTITION_TYPES))
}
