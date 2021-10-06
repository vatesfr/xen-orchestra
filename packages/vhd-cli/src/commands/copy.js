import { getSyncedHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'
import { VhdDirectory, VhdFile } from 'vhd-lib'
import Disposable from 'promise-toolbox/Disposable'
import getopts from 'getopts'

export default async rawArgs => {
  const {
    directory,
    help,
    _: args,
  } = getopts(rawArgs, {
    alias: {
      directory: 'd',
      help: 'h',
    },
    boolean: ['directory', 'force'],
    default: {
      directory: false,
      help: false,
    },
  })
  if (args.length < 2 || help) {
    return `Usage: index.js copy <source VHD> <destination> --directory --force`
  }
  const [sourcePath, destPath] = args

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' })
    const resolvedSourcePath = resolve(sourcePath)
    let src
    try {
      src = yield VhdFile.open(handler, resolvedSourcePath)
    } catch (e) {
      if (e.code === 'EISDIR') {
        src = yield VhdDirectory.open(handler, resolvedSourcePath)
      } else {
        throw e
      }
    }

    await src.readBlockAllocationTable()
    const resolvedDestPath = resolve(destPath)
    const dest = yield directory
      ? VhdDirectory.create(handler, resolvedDestPath)
      : VhdFile.create(handler, resolvedDestPath)
    // copy data
    dest.header = src.header
    dest.footer = src.footer
    dest.blockTable = Buffer.from(src.blockTable)

    for (let i = 0; i < src.header.maxTableEntries; i++) {
      if (src.containsBlock(i)) {
        const block = await src.readBlock(i)
        await dest.writeEntireBlock(block)
      }
    }

    // copy parent locators
    for (let parentLocatorId = 0; parentLocatorId < 8; parentLocatorId++) {
      const parentLocator = await src.readParentLocator(parentLocatorId)
      if (parentLocator) {
        await dest.writeParentLocator(parentLocator)
      }
    }
    await dest.writeFooter()
    await dest.writeHeader({ allowOverwrite: true }) // header could have already be written by parentLocator
    await dest.writeBlockAllocationTable()
  })
}
