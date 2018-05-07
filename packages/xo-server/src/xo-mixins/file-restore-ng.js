import defer from 'golike-defer'
import execa from 'execa'
import splitLines from 'split-lines'
import { createParser as createPairsParser } from 'parse-pairs'
import { normalize } from 'path'
import { readdir, rmdir, stat } from 'fs-extra'
import { ZipFile } from 'yazl'

import { lvs, pvs } from '../lvm'
import { resolveSubpath, tmpDir } from '../utils'

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

const PARTITION_TYPE_NAMES = {
  0x07: 'NTFS',
  0x0c: 'FAT',
  0x83: 'linux',
}

const RE_VHDI = /^vhdi(\d+)$/

const parsePartxLine = createPairsParser({
  keyTransform: key => (key === 'UUID' ? 'id' : key.toLowerCase()),
  valueTransform: (value, key) =>
    key === 'start' || key === 'size'
      ? +value
      : key === 'type' ? PARTITION_TYPE_NAMES[+value] || value : value,
})

const listLvmLogicalVolumes = defer(
  async ($defer, devicePath, partition, results = []) => {
    const pv = await mountLvmPhysicalVolume(devicePath, partition)
    $defer(pv.unmount)

    const lvs = await pvs(['lv_name', 'lv_path', 'lv_size', 'vg_name'], pv.path)
    const partitionId = partition !== undefined ? partition.id : ''
    lvs.forEach((lv, i) => {
      const name = lv.lv_name
      if (name !== '') {
        results.push({
          id: `${partitionId}/${lv.vg_name}/${name}`,
          name,
          size: lv.lv_size,
        })
      }
    })
    return results
  }
)

async function mountLvmPhysicalVolume (devicePath, partition) {
  const args = []
  if (partition !== undefined) {
    args.push('-o', partition.start * 512)
  }
  args.push('--show', '-f', devicePath)
  const path = (await execa.stdout('losetup', args)).trim()
  await execa('pvscan', ['--cache', path])

  return {
    path,
    unmount: async () => {
      try {
        const vgNames = await pvs('vg_name', path)
        await execa('vgchange', ['-an', ...vgNames])
      } finally {
        await execa('losetup', ['-d', path])
      }
    },
  }
}

const mountPartition = defer(async ($defer, devicePath, partition) => {
  const options = ['loop', 'ro']

  if (partition !== undefined) {
    const { start } = partition
    if (start !== undefined) {
      options.push(`offset=${start * 512}`)
    }
  }

  const path = await tmpDir()
  $defer.onFailure(rmdir, path)

  const mount = options =>
    execa('mount', [
      `--options=${options.join(',')}`,
      `--source=${devicePath}`,
      `--target=${path}`,
    ])

  // `norecovery` option is used for ext3/ext4/xfs, if it fails it might be
  // another fs, try without
  try {
    await mount([...options, 'norecovery'])
  } catch (error) {
    await mount(options)
  }
  const unmount = async () => {
    await execa('umount', ['--lazy', path])
    return rmdir(path)
  }
  $defer.onFailure(unmount)

  return { path, unmount }
})

// - [x] list partitions
// - [x] list files in a partition
// - [x] list files in a bare partition
// - [x] list LVM partitions
//
// - [ ] partitions with unmount debounce
// - [ ] handle directory restore
// - [ ] handle multiple entries restore (both dirs and files)
//       - [ ] by default use common path as root
// - [ ] handle LVM partitions on multiple disks
// - [ ] find mounted disks/partitions on start (in case of interruptions)
//
// - [ ] manual mount/unmount (of disk) for advance file restore
//       - could it stay mounted during the backup process?
//       - [ ] mountDisk (VHD)
//       - [ ] unmountDisk (only for manual mount)
//       - [ ] getMountedDisks
//       - [ ] mountPartition (optional)
//       - [ ] getMountedPartitions
//       - [ ] unmountPartition
export default class BackupNgFileRestore {
  constructor (app) {
    this._app = app
    this._mounts = { __proto__: null }
  }

  @defer
  async fetchBackupNgPartitionFiles (
    $defer,
    remoteId,
    diskId,
    partitionId,
    paths
  ) {
    const disk = await this._mountDisk(remoteId, diskId)
    $defer.onFailure(disk.unmount)

    const partition = await this._mountPartition(disk.path, partitionId)
    $defer.onFailure(partition.unmount)

    const zip = new ZipFile()
    paths.forEach(file => {
      zip.addFile(resolveSubpath(partition.path, file), normalize('./' + file))
    })
    zip.end()
    return zip.outputStream.on('end', () =>
      partition.unmount().then(disk.unmount)
    )
  }

  @defer
  async listBackupNgDiskPartitions ($defer, remoteId, diskId) {
    const disk = await this._mountDisk(remoteId, diskId)
    $defer(disk.unmount)
    return this._listPartitions(disk.path)
  }

  @defer
  async listBackupNgPartitionFiles (
    $defer,
    remoteId,
    diskId,
    partitionId,
    path
  ) {
    const disk = await this._mountDisk(remoteId, diskId)
    $defer(disk.unmount)

    const partition = await this._mountPartition(disk.path, partitionId)
    $defer(partition.unmount)

    path = resolveSubpath(partition.path, path)

    const entriesMap = {}
    await Promise.all(
      (await readdir(path)).map(async name => {
        try {
          const stats = await stat(`${path}/${name}`)
          entriesMap[stats.isDirectory() ? `${name}/` : name] = {}
        } catch (error) {
          if (error == null || error.code !== 'ENOENT') {
            throw error
          }
        }
      })
    )
    return entriesMap
  }

  async _findPartition (devicePath, partitionId) {
    const partitions = await this._listPartitions(devicePath, false)
    const partition = partitions.find(_ => _.id === partitionId)
    if (partition === undefined) {
      throw new Error(`partition ${partitionId} not found`)
    }
    return partition
  }

  async _listPartitions (devicePath, inspectLvmPv = true) {
    const stdout = await execa.stdout('partx', [
      '--bytes',
      '--output=NR,START,SIZE,NAME,UUID,TYPE',
      '--pairs',
      devicePath,
    ])

    const promises = []
    const partitions = []
    splitLines(stdout).forEach(line => {
      const partition = parsePartxLine(line)
      let { type } = partition
      if (type == null || (type = +type) in IGNORED_PARTITION_TYPES) {
        return
      }

      if (inspectLvmPv && type === 0x8e) {
        promises.push(listLvmLogicalVolumes(devicePath, partition, partitions))
        return
      }

      partitions.push(partition)
    })

    await Promise.all(promises)

    return partitions
  }

  @defer
  async _mountDisk ($defer, remoteId, diskId) {
    const handler = await this._app.getRemoteHandler(remoteId)
    if (handler._getFilePath === undefined) {
      throw new Error(`this remote is not supported`)
    }

    const diskPath = handler._getFilePath(diskId)
    const mountDir = await tmpDir()
    $defer.onFailure(rmdir, mountDir)

    await execa('vhdimount', [diskPath, mountDir])
    const unmount = async () => {
      await execa('fusermount', ['-uz', mountDir])
      return rmdir(mountDir)
    }
    $defer.onFailure(unmount)

    let max = 0
    let maxEntry
    const entries = await readdir(mountDir)
    entries.forEach(entry => {
      const matches = RE_VHDI.exec(entry)
      if (matches !== null) {
        const value = +matches[1]
        if (value > max) {
          max = value
          maxEntry = entry
        }
      }
    })
    if (max === 0) {
      throw new Error('no disks found')
    }

    return {
      path: `${mountDir}/${maxEntry}`,
      unmount,
    }
  }

  @defer
  async _mountPartition ($defer, devicePath, partitionId) {
    if (partitionId === undefined) {
      return mountPartition(devicePath)
    }

    if (partitionId.includes('/')) {
      const [pvId, vgName, lvName] = partitionId.split('/')
      const lvmPartition =
        pvId !== '' ? await this._findPartition(devicePath, pvId) : undefined

      const pv = await mountLvmPhysicalVolume(devicePath, lvmPartition)

      const unmountQueue = [pv.unmount]
      const unmount = async () => {
        let fn
        while ((fn = unmountQueue.pop()) !== undefined) {
          await fn()
        }
      }
      $defer.onFailure(unmount)

      await execa('vgchange', ['-ay', vgName])
      unmountQueue.push(() => execa('vgchange', ['-an', vgName]))

      const partition = await mountPartition(
        (await lvs(['lv_name', 'lv_path'], vgName)).find(
          _ => _.lv_name === lvName
        ).lv_path
      )
      unmountQueue.push(partition.unmount)
      return { ...partition, unmount }
    }

    return mountPartition(
      devicePath,
      await this._findPartition(devicePath, partitionId)
    )
  }
}
