'use strict'

const fromCallback = require('promise-toolbox/fromCallback')
const { createLogger } = require('@xen-orchestra/log')
const { createParser } = require('parse-pairs')
const { execFile } = require('child_process')

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
}

const LVM_PARTITION_TYPE = 0x8e
exports.LVM_PARTITION_TYPE = LVM_PARTITION_TYPE

const parsePartxLine = createParser({
  keyTransform: key => (key === 'UUID' ? 'id' : key.toLowerCase()),
  valueTransform: (value, key) => (key === 'start' || key === 'size' || key === 'type' ? +value : value),
})

// returns an empty array in case of a non-partitioned disk
exports.listPartitions = async function listPartitions(devicePath) {
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
