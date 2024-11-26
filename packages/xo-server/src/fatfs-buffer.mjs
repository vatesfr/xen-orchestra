// Buffer driver for [fatfs](https://github.com/natevw/fatfs).
//
// Usage:
//
// ```js
// import fatfs from '@vates/fatfs'
// import fatfsBuffer, { init as fatfsBufferInit } from './fatfs-buffer.mjs'
//
// const buffer = fatfsBufferinit()
//
// const fs = fatfs.createFileSystem(fatfsBuffer(buffer))
//
// fs.writeFile('/foo', 'content of foo', function (err, content) {
//   if (err) {
//     console.error(err)
//   }
// })

import assert from 'assert'
import { boot16 as fat16 } from '@vates/fatfs/structs.js'

const SECTOR_SIZE = 512

const TEN_MIB = 10 * 1024 * 1024

// https://en.wikipedia.org/wiki/Master_boot_record
// we'll add a classical generic mbr
// with one FAT16 partition addressed by LBA

export function addMbr(buf) {
  const mbr = Buffer.alloc(SECTOR_SIZE, 0)
  // 0 - 446 is bootstrap code , keep it empty

  // entry
  mbr[446] = 0x80 // entry is bootable
  mbr[450] = 0x0e // FAT16 LBA
  mbr.writeInt32LE(1, 454) // LBA address of first sector
  assert.strictEqual(buf.length % SECTOR_SIZE, 0, 'buffer  length must be aligned to sector size')
  mbr.writeInt32LE(buf.length / SECTOR_SIZE + 1, 458) // LBA address of last sector

  // 3 more 16 bytes entry we don't need

  // boot signature
  mbr[510] = 0x55
  mbr[511] = 0xaa
  return Buffer.concat([mbr, buf])
}

// Creates a 10MB buffer and initializes it as a FAT 16 volume.
export function init({ label = 'NO LABEL   ' } = {}) {
  assert.strictEqual(typeof label, 'string')
  assert.strictEqual(label.length, 11)

  const buf = Buffer.alloc(TEN_MIB)

  // https://github.com/natevw/fatfs/blob/master/structs.js
  fat16.pack(
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

  // End of sector.
  buf[0x1fe] = 0x55
  buf[0x1ff] = 0xaa

  // Mark sector as reserved.
  buf[0x200] = 0xf8
  buf[0x201] = 0xff
  buf[0x202] = 0xff
  buf[0x203] = 0xff

  // Mark sector as reserved.
  buf[0x2a00] = 0xf8
  buf[0x2a01] = 0xff
  buf[0x2a02] = 0xff
  buf[0x2a03] = 0xff

  return buf
}

export default buffer => {
  return {
    sectorSize: SECTOR_SIZE,
    numSectors: Math.floor(buffer.length / SECTOR_SIZE),
    readSectors: (i, target, cb) => {
      buffer.copy(target, 0, i * SECTOR_SIZE)
      cb()
    },
    writeSectors: (i, source, cb) => {
      source.copy(buffer, i * SECTOR_SIZE, 0)
      cb()
    },
  }
}
