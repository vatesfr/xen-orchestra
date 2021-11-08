import { getSyncedHandler } from '@xen-orchestra/fs'
import { openVhd, VhdFile, VhdDirectory } from 'vhd-lib'
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
  if (args.length < 4 || help) {
    return `Usage: index.js copy <sourceRemoteUrl> <source VHD> <destionationRemoteUrl> <destination> --directory`
  }
  const [sourceRemoteUrl, sourcePath, destRemoteUrl, destPath] = args

  await Disposable.use(async function* () {
    const sourceHandler = yield getSyncedHandler({ url: sourceRemoteUrl })
    const src = yield openVhd(sourceHandler, sourcePath)
    await src.readBlockAllocationTable()
    const destHandler = yield getSyncedHandler({ url: destRemoteUrl })
    const dest = yield directory ? VhdDirectory.create(destHandler, destPath) : VhdFile.create(destHandler, destPath)
    // copy data
    dest.header = src.header
    dest.footer = src.footer

    for await (const block of src.blocks()) {
      await dest.writeEntireBlock(block)
    }

    // copy parent locators
    for (let parentLocatorId = 0; parentLocatorId < 8; parentLocatorId++) {
      const parentLocator = await src.readParentLocator(parentLocatorId)
      await dest.writeParentLocator(parentLocator)
    }
    await dest.writeFooter()
    await dest.writeHeader()
    await dest.writeBlockAllocationTable()
  })
}
