import { VhdFile, ChunkedVhd } from 'vhd-lib'

import { getHandler } from '@xen-orchestra/fs'
import getopts from 'getopts'
import { resolve } from 'path'
import Disposable from 'promise-toolbox/Disposable'

export default async rawArgs => {
  const {
    chunk,
    force,
    _: args,
  } = getopts(rawArgs, {
    alias: {
      chunk: 'c',
      force: 'f',
    },
    boolean: ['chunk', 'force'],
    default: {
      chunk: false,
      force: false,
    },
  })
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <source VHD> <destination> --chunk --force`
  }
  const source = args[0]
  const dest = args[1]
  const handler = getHandler({ url: 'file:///' })

  const sourceIsDirectory = await handler.isDirectory(source)

  const destExists = await handler.exists(dest)
  if (destExists && !force) {
    throw new Error(`${dest} already exists, use --force to overwrite`)
  }
  if (destExists) {
    const destIsDirectory = await handler.isDirectory(dest)

    if (destIsDirectory && !chunk) {
      throw new Error(`${dest} is a file, can't write in chunk mode `)
    }

    if (!destIsDirectory && chunk) {
      throw new Error(`${dest} already is a directory, can't write in non chunk mode `)
    }
  }

  const sourceVhd = sourceIsDirectory
    ? ChunkedVhd.open(handler, resolve(source))
    : VhdFile.open(handler, resolve(source))
  const destVhd = chunk ? ChunkedVhd.open(handler, resolve(dest), 'w') : VhdFile.open(handler, resolve(dest), 'w')

  await Disposable.use(await sourceVhd, await destVhd, async (src, dest) => {
    await src.readHeaderAndFooter()
    await src.readBlockAllocationTable()
    // copy data
    dest.header = src.header
    dest.footer = src.footer
    dest.blockTable = Buffer.from(src.blockTable)
    // computed data from src.readBlockAllocationTable, needed for dest._writeEntireBlock
    dest.fullBlockSize = src.fullBlockSize
    dest.bitmapSize = src.bitmapSize
    dest.sectorsOfBitmap = src.sectorsOfBitmap
    dest.sectorsPerBlock = src.sectorsPerBlock

    await dest.writeFooter()
    await dest.writeHeader()
    await dest.writeBlockAllocationTable()

    for (let i = 0; i < src.header.maxTableEntries; i++) {
      if (src.containsBlock(i)) {
        const block = await src._readBlock(i)
        await dest._writeEntireBlock(block)
      }
    }

    // copy parent Locator
    for (let i = 0; i < 8; i++) {
      if (src.header.parentLocatorEntry[i].platformDataOffset) {
        const { platformDataOffset, platformDataSpace } = src.header.parentLocatorEntry[i]
        await src._write(platformDataOffset, await src._read(platformDataOffset, platformDataSpace))
      }
    }
  })
}
