'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { promisify } = require('node:util')

const fatfs = require('./')
const { boot16, boot32 } = require('./structs.js')

const SECTOR_SIZE = 512
const DIR_ENTRY_SIZE = 32
const ATTR_VOLUME_ID = 0x08
const ATTR_DIRECTORY = 0x10
const ATTR_LONG_NAME = 0x0f

const LABEL = 'cidata     '
const SHORT_LABEL = 'CIDATA     '

// Same 10 MiB FAT16 layout as xo-server's fatfs-buffer.mjs (cloud-init config drives)
function packFat16(buf, label) {
  boot16.pack(
    {
      jmpBoot: Buffer.from('eb3c90', 'hex'),
      OEMName: 'mkfs.fat',
      BytsPerSec: SECTOR_SIZE,
      SecPerClus: 4,
      ResvdSecCnt: 1,
      NumFATs: 2,
      RootEntCnt: 512,
      TotSec16: 20480,
      Media: 248,
      FATSz16: 20,
      SecPerTrk: 32,
      NumHeads: 64,
      HiddSec: 0,
      TotSec32: 0,
      DrvNum: 128,
      Reserved1: 0,
      BootSig: 41,
      VolID: 895111106,
      VolLab: label,
      FilSysType: 'FAT16   ',
    },
    buf
  )
  for (const fatStart of [1 * SECTOR_SIZE, 21 * SECTOR_SIZE]) {
    buf.writeUInt16LE(0xfff8, fatStart)
    buf.writeUInt16LE(0xffff, fatStart + 2)
  }
}

// Smallest FAT32 the library recognizes (65 525 clusters or more), one sector per cluster
// so that the root directory spans several clusters after a few files
const FAT32_CLUSTERS = 65600
const FAT32_FAT_SECTORS = Math.ceil(((FAT32_CLUSTERS + 2) * 4) / SECTOR_SIZE)
const fat32Sectors = sectorsPerCluster => 32 + 2 * FAT32_FAT_SECTORS + FAT32_CLUSTERS * sectorsPerCluster
function packFat32(buf, label, freeClusters, sectorsPerCluster) {
  boot32.pack(
    {
      jmpBoot: Buffer.from('eb5890', 'hex'),
      OEMName: 'mkfs.fat',
      BytsPerSec: SECTOR_SIZE,
      SecPerClus: sectorsPerCluster,
      ResvdSecCnt: 32,
      NumFATs: 2,
      RootEntCnt: 0,
      TotSec16: 0,
      Media: 248,
      FATSz16: 0,
      SecPerTrk: 32,
      NumHeads: 64,
      HiddSec: 0,
      TotSec32: fat32Sectors(sectorsPerCluster),
      FATSz32: FAT32_FAT_SECTORS,
      ExtFlags: { NumActiveFAT: 0, _reserved1: 0, MirroredFAT: false, _reserved2: 0 },
      FSVer: { Major: 0, Minor: 0 },
      RootClus: 2,
      FSInfo: 1,
      BkBootSec: 6,
      Reserved: Buffer.alloc(12),
      DrvNum: 128,
      Reserved1: 0,
      BootSig: 41,
      VolID: 895111106,
      VolLab: label,
      FilSysType: 'FAT32   ',
    },
    buf
  )
  for (const fatStart of [32 * SECTOR_SIZE, (32 + FAT32_FAT_SECTORS) * SECTOR_SIZE]) {
    buf.writeUInt32LE(0x0ffffff8, fatStart)
    buf.writeUInt32LE(0x0fffffff, fatStart + 4)
    buf.writeUInt32LE(0x0fffffff, fatStart + 8) // root directory: one cluster, end of chain
    if (freeClusters !== undefined) {
      for (let cluster = 3 + freeClusters; cluster < FAT32_CLUSTERS + 2; cluster++) {
        buf.writeUInt32LE(0x0fffffff, fatStart + cluster * 4) // in use: nothing else can be allocated
      }
    }
  }
  buf.writeUInt32LE(0x41615252, SECTOR_SIZE) // FSInfo: signatures, free count and next free unknown
  buf.writeUInt32LE(0x61417272, SECTOR_SIZE + 484)
  buf.writeUInt32LE(0xffffffff, SECTOR_SIZE + 488)
  buf.writeUInt32LE(0xffffffff, SECTOR_SIZE + 492)
  buf.writeUInt32LE(0xaa550000, SECTOR_SIZE + 508)
}

function createVolume({
  fat32 = false,
  freeClusters,
  sectorsPerCluster = 1,
  dirtyClusters = false,
  readOnly = false,
  label = LABEL,
} = {}) {
  const buf = Buffer.alloc(fat32 ? fat32Sectors(sectorsPerCluster) * SECTOR_SIZE : 10 * 1024 * 1024)
  ;(fat32 ? packFat32 : packFat16)(buf, label, freeClusters, sectorsPerCluster)
  if (fat32 && dirtyClusters) {
    buf.fill(0x41, (32 + 2 * FAT32_FAT_SECTORS + sectorsPerCluster) * SECTOR_SIZE) // every cluster but the root one
  }
  buf[0x1fe] = 0x55
  buf[0x1ff] = 0xaa
  if (fat32) {
    buf.copy(buf, 6 * SECTOR_SIZE, 0, SECTOR_SIZE) // backup boot sector
  }
  const driver = {
    sectorSize: SECTOR_SIZE,
    numSectors: Math.floor(buf.length / SECTOR_SIZE),
    readSectors: (i, target, cb) => {
      buf.copy(target, 0, i * SECTOR_SIZE)
      cb()
    },
  }
  if (!readOnly) {
    driver.writeSectors = (i, source, cb) => {
      source.copy(buf, i * SECTOR_SIZE, 0)
      cb()
    }
  }
  const fs = fatfs.createFileSystem(driver)
  const wrap = name => promisify(fs[name].bind(fs))
  return {
    buf,
    fs,
    createLabel: wrap('createLabel'),
    mkdir: wrap('mkdir'),
    readdir: wrap('readdir'),
    readFile: wrap('readFile'),
    stat: wrap('stat'),
    writeFile: wrap('writeFile'),
  }
}

function geometry(buf) {
  const bytesPerSector = buf.readUInt16LE(11)
  const fatSectors16 = buf.readUInt16LE(22)
  return {
    bytesPerSector,
    sectorsPerCluster: buf.readUInt8(13),
    reservedSectors: buf.readUInt16LE(14),
    fats: buf.readUInt8(16),
    rootEntries: buf.readUInt16LE(17),
    fatSectors: fatSectors16 || buf.readUInt32LE(36),
    fat32: fatSectors16 === 0,
  }
}

function readFat(buf) {
  const g = geometry(buf)
  return buf.subarray(g.reservedSectors * g.bytesPerSector, (g.reservedSectors + g.fatSectors) * g.bytesPerSector)
}

// Byte ranges holding the root directory: a fixed area on FAT16, a cluster chain on FAT32
function rootRegions(buf) {
  const g = geometry(buf)
  const firstDataSector = g.reservedSectors + g.fats * g.fatSectors
  if (!g.fat32) {
    return [[firstDataSector * g.bytesPerSector, g.rootEntries * DIR_ENTRY_SIZE]]
  }
  const regions = []
  const clusterSize = g.sectorsPerCluster * g.bytesPerSector
  let cluster = buf.readUInt32LE(44)
  while (cluster < 0x0ffffff8) {
    regions.push([(firstDataSector + (cluster - 2) * g.sectorsPerCluster) * g.bytesPerSector, clusterSize])
    cluster = buf.readUInt32LE(g.reservedSectors * g.bytesPerSector + cluster * 4) & 0x0fffffff
  }
  return regions
}

function rootBytes(buf) {
  return Buffer.concat(rootRegions(buf).map(([start, length]) => buf.subarray(start, start + length)))
}

// Active root directory entries, in on-disk order
function readRootEntries(buf) {
  const entries = []
  let index = 0
  for (const [start, length] of rootRegions(buf)) {
    for (let offset = start; offset < start + length; offset += DIR_ENTRY_SIZE, index++) {
      if (buf[offset] === 0x00) {
        return entries
      }
      if (buf[offset] === 0xe5) {
        continue
      }
      const attr = buf[offset + 11]
      const isLongName = attr === ATTR_LONG_NAME
      let longNamePart = ''
      if (isLongName) {
        for (const [at, chars] of [
          [1, 5],
          [14, 6],
          [28, 2],
        ]) {
          for (let k = 0; k < chars; k++) {
            const c = buf.readUInt16LE(offset + at + k * 2)
            if (c !== 0x0000 && c !== 0xffff) {
              longNamePart += String.fromCharCode(c)
            }
          }
        }
      }
      entries.push({
        index,
        attr,
        isLongName,
        isVolumeLabel: !isLongName && (attr & ATTR_VOLUME_ID) !== 0 && (attr & ATTR_DIRECTORY) === 0,
        shortName: buf.toString('latin1', offset, offset + 11),
        longNamePart,
        firstCluster: isLongName ? undefined : (buf.readUInt16LE(offset + 20) << 16) + buf.readUInt16LE(offset + 26),
        fileSize: isLongName ? undefined : buf.readUInt32LE(offset + 28),
        createDate: isLongName ? undefined : buf.readUInt16LE(offset + 16),
        writeDate: isLongName ? undefined : buf.readUInt16LE(offset + 24),
      })
    }
  }
  return entries
}

// Long name bound to the short entry at `position`: the long name entries right before it
function longNameOf(entries, position) {
  const parts = []
  for (let i = position - 1; i >= 0 && entries[i].isLongName; i--) {
    parts.push(entries[i].longNamePart)
  }
  return parts.join('')
}

function longNamesOfFiles(entries) {
  return entries.filter(e => !e.isLongName && !e.isVolumeLabel).map(e => longNameOf(entries, entries.indexOf(e)))
}

function assertBareLabel(entries, shortName) {
  const labels = entries.filter(e => e.isVolumeLabel)
  assert.equal(labels.length, 1, 'exactly one volume label entry')
  const label = labels[0]
  assert.equal(longNameOf(entries, entries.indexOf(label)), '', 'no long name entry precedes the label')
  // a long name binds to the short entry that immediately follows it: none may end on the label
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].isLongName) {
      let j = i
      while (j < entries.length && entries[j].isLongName) {
        j++
      }
      assert.ok(j < entries.length && !entries[j].isVolumeLabel, 'no long name entry is bound to the label')
    }
  }
  assert.equal(label.shortName, shortName)
  assert.equal(label.attr, ATTR_VOLUME_ID, 'ATTR_VOLUME_ID and nothing else')
  assert.equal(label.firstCluster, 0, 'a label owns no data')
  assert.equal(label.fileSize, 0)
  assert.notEqual(label.createDate, 0, 'creation date is set')
  assert.notEqual(label.writeDate, 0, 'write date is set')
  return label
}

describe('createLabel', () => {
  it('writes a bare volume label entry, without any long name entry', async () => {
    const { buf, createLabel, writeFile } = createVolume()
    await writeFile('meta-data', 'instance-id: test\n')
    await createLabel(LABEL)
    assertBareLabel(readRootEntries(buf), SHORT_LABEL)
  })

  it('keeps the long name entries of regular files', async () => {
    const { buf, createLabel, readdir, writeFile } = createVolume()
    await writeFile('meta-data', 'instance-id: test\n')
    await createLabel(LABEL)
    await writeFile('network-config', 'version: 2\n')

    assert.deepEqual(longNamesOfFiles(readRootEntries(buf)).sort(), ['meta-data', 'network-config'])
    assert.deepEqual((await readdir('/')).sort(), ['meta-data', 'network-config'], 'the label is not listed as a file')
  })

  it('does not allocate a data cluster for the label', async () => {
    const { buf, createLabel } = createVolume()
    const before = Buffer.from(readFat(buf))
    await createLabel(LABEL) // very first operation on the volume
    assert.ok(readFat(buf).equals(before), 'the FAT is unchanged')
  })

  it('does not turn an existing file into the label', async () => {
    const { buf, createLabel, writeFile } = createVolume()
    await writeFile('cidata', 'not a label\n')
    await assert.rejects(createLabel(LABEL), { code: 'EXIST' })
    assert.equal(readRootEntries(buf).filter(e => e.isVolumeLabel).length, 0, 'the file was left untouched')
  })

  it('refuses a second label', async () => {
    const { buf, createLabel } = createVolume()
    await createLabel(LABEL)
    await assert.rejects(createLabel('OTHER'), { code: 'EXIST' })
    assertBareLabel(readRootEntries(buf), SHORT_LABEL)
  })

  it('refuses to write on a read-only volume', async () => {
    const { buf, createLabel } = createVolume({ readOnly: true })
    const before = Buffer.from(buf)
    await assert.rejects(createLabel(LABEL), { code: 'ROFS' })
    assert.ok(buf.equals(before), 'nothing was written')
  })

  it('writes the label as eleven raw characters', { timeout: 10000 }, async () => {
    for (const [name, shortName] of [
      ['ABCDEFGHIJK', 'ABCDEFGHIJK'],
      ['no label', 'NO LABEL   '],
      ['x', 'X          '],
      ['constructor', 'CONSTRUCTOR'], // keys of Object.prototype are valid labels
      ['__proto__', '__PROTO__  '],
      ['toString', 'TOSTRING   '],
    ]) {
      const { buf, createLabel } = createVolume()
      await createLabel(name)
      assertBareLabel(readRootEntries(buf), shortName)
    }
  })

  it('rejects invalid labels and leaves the volume usable', async () => {
    const { buf, createLabel, writeFile } = createVolume()
    for (const [name, code] of [
      ['', 'INVAL'],
      ['ABCDEFGHIJKL', 'NAMETOOLONG'],
      ['a.b', 'INVAL'],
      ['a/b', 'INVAL'],
      ['a:b', 'INVAL'],
      ['a*b', 'INVAL'],
      ['été', 'INVAL'],
      [' CIDATA', 'INVAL'], // leading space: refused by fatlabel as well
      ['ß', 'INVAL'], // would become 'SS' once uppercased
      ['ſ', 'INVAL'], // would become 'S'
      ['ı', 'INVAL'], // would become 'I'
    ]) {
      await assert.rejects(createLabel(name), { code }, `${JSON.stringify(name)} is rejected with ${code}`)
    }
    assert.equal(readRootEntries(buf).filter(e => e.isVolumeLabel).length, 0)
    await writeFile('after', 'the queue is still running\n')
    assert.deepEqual(longNamesOfFiles(readRootEntries(buf)), ['after'])
  })

  it('calls back once with the expected error code, and keeps the queue running after an error', async () => {
    for (const [name, code] of [
      [LABEL, undefined],
      ['a.b', 'INVAL'],
    ]) {
      const { fs, writeFile } = createVolume()
      let calls = 0
      let calledSynchronously = true
      const result = await new Promise(resolve => {
        fs.createLabel(name, error => {
          calls++
          resolve({ error, synchronous: calledSynchronously })
        })
        calledSynchronously = false
      })
      assert.equal(result.synchronous, false, `${JSON.stringify(name)}: callback is asynchronous`)
      assert.equal(result.error ? result.error.code : undefined, code, `${JSON.stringify(name)}: error code`)
      await writeFile('after', 'the queue is still running\n') // hangs if the lock was not released
      assert.equal(calls, 1, `${JSON.stringify(name)}: callback called once`)
    }
  })

  it('fills the last slot of a FAT16 root directory without an end marker, and refuses more', async () => {
    const { buf, createLabel, writeFile } = createVolume()
    // 254 files × 2 entries + one file × 3 entries = 511 of the 512 root entries
    for (let i = 0; i < 254; i++) {
      await writeFile(`f${String(i).padStart(3, '0')}`, 'x')
    }
    await writeFile('fourteen-chars', 'x')
    assert.equal(readRootEntries(buf).length, 511)

    await createLabel(LABEL)
    const entries = readRootEntries(buf)
    assert.equal(entries.length, 512, 'the label took the last slot')
    assertBareLabel(entries, SHORT_LABEL)

    const rootBefore = Buffer.from(rootBytes(buf))
    const fatBefore = Buffer.from(readFat(buf))
    await assert.rejects(writeFile('overflow', 'x'), { code: 'NOSPC' })
    assert.ok(rootBytes(buf).equals(rootBefore), 'a refused entry writes nothing')
    assert.ok(readFat(buf).equals(fatBefore), 'a refused entry allocates nothing')
  })

  it('works on FAT32 once the root directory spans several clusters', async () => {
    const { buf, createLabel, readdir, writeFile } = createVolume({ fat32: true })
    const names = Array.from({ length: 9 }, (_, i) => `file-${i}`) // 18 entries: more than one cluster
    for (const name of names) {
      await writeFile(name, `${name}\n`)
    }
    assert.equal(rootRegions(buf).length, 2, 'the root directory grew to a second cluster')

    const before = Buffer.from(readFat(buf))
    await createLabel(LABEL)
    assert.ok(readFat(buf).equals(before), 'the FAT is unchanged')
    const entries = readRootEntries(buf)
    assertBareLabel(entries, SHORT_LABEL)
    assert.deepEqual(longNamesOfFiles(entries).sort(), names.sort())
    assert.deepEqual((await readdir('/')).sort(), names)
  })

  it('leaves the regular file and directory path unchanged', async () => {
    const { buf, mkdir, readFile, readdir, writeFile } = createVolume()
    await mkdir('dir')
    await writeFile('dir/inside', 'inside\n')
    await writeFile('network-config', 'first\n')
    await writeFile('network-config2', 'second\n') // same 8.3 prefix: needs a numeric tail

    const entries = readRootEntries(buf)
    const files = entries.filter(e => !e.isLongName && !(e.attr & ATTR_DIRECTORY))
    assert.equal(new Set(files.map(e => e.shortName)).size, files.length, 'short names are distinct')
    assert.deepEqual(longNamesOfFiles(entries).sort(), ['dir', 'network-config', 'network-config2'])
    assert.ok(
      entries.some(e => e.attr === (ATTR_DIRECTORY | 0x20) || e.attr === ATTR_DIRECTORY),
      'directory entry'
    )
    assert.equal((await readFile('network-config')).toString(), 'first\n')
    assert.equal((await readFile('network-config2')).toString(), 'second\n')
    assert.equal((await readFile('dir/inside')).toString(), 'inside\n')
    assert.deepEqual(await readdir('dir'), ['inside'])
    assert.deepEqual((await readdir('/')).sort(), ['dir', 'network-config', 'network-config2'])
  })
  it('never gets the numeric tail files with the same short name get', async () => {
    const { buf, createLabel, writeFile } = createVolume()
    await writeFile('cid ata', 'x') // short name CIDATA
    await writeFile('ci data', 'x') // short name CIDATA~2
    await createLabel('cidata') // a file would get CIDATA~3
    assertBareLabel(readRootEntries(buf), SHORT_LABEL)
  })
  it('fills the last slot of a FAT32 root cluster without an end marker, even with a full FAT', async () => {
    // seven files, and exactly seven free clusters for their data: nothing is left for the directory
    const { buf, createLabel, readdir, writeFile } = createVolume({ fat32: true, freeClusters: 7 })
    const names = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'fourteen-chars'] // 6 × 2 + 3 = 15 of 16 entries
    for (const name of names) {
      await writeFile(name, 'x')
    }
    assert.equal(rootRegions(buf).length, 1)
    const fatBefore = Buffer.from(readFat(buf))

    await createLabel(LABEL)
    const entries = readRootEntries(buf)
    assert.equal(entries.length, 16, 'the label took the last slot of the cluster')
    assertBareLabel(entries, SHORT_LABEL)
    assert.ok(readFat(buf).equals(fatBefore), 'no cluster was allocated for an end marker')
    assert.deepEqual((await readdir('/')).sort(), names.sort())
    await assert.rejects(writeFile('overflow', 'x'), { code: 'NOSPC' })
  })
  it('still writes the end marker inside a freshly allocated cluster', async () => {
    const { buf, readdir, writeFile } = createVolume({ fat32: true, sectorsPerCluster: 4, dirtyClusters: true })
    const names = []
    for (let i = 0; i < 32; i++) {
      names.push(`f${String(i).padStart(2, '0')}`) // 32 × 2 entries: the root cluster is exactly full
      await writeFile(names[i], 'x')
    }
    names.push('a'.repeat(195)) // 15 long name entries + 1: a new cluster, with the end marker inside it
    await writeFile(names[32], 'x')
    assert.equal(rootRegions(buf).length, 2)
    assert.equal(readRootEntries(buf).length, 80, 'the dirty rest of the new cluster is not read as entries')
    assert.deepEqual((await readdir('/')).sort(), names.sort())
  })
})
