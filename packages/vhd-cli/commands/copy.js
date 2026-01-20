'use strict'

const { getSyncedHandler } = require('@xen-orchestra/fs')
const { openVhd, VhdFile, VhdDirectory } = require('vhd-lib')
const Disposable = require('promise-toolbox/Disposable')
const getopts = require('getopts')

module.exports = async function copy(rawArgs) {
  const {
    directory,
    d,
    help,
    h,
    _: args,
    ...unexpectedArgs
  } = getopts(rawArgs, {
    alias: {
      directory: 'd',
      help: 'h',
    },
    boolean: ['directory', 'help'],
    default: {
      directory: false,
      help: false,
    },
  })
  if (args.length < 4 || help) {
    return `Copies a VHD. Use --directory if copied VHD is a VHD direcory.
    Usage: ${this.command} <sourceRemoteUrl> <source VHD> <destinationRemoteUrl> <destination> [--directory]`
  }
  const unexpectedArgsList = Object.keys(unexpectedArgs)
  if (unexpectedArgsList.length > 0) {
    return `Option${unexpectedArgsList.length > 1 ? 's' : ''} ${unexpectedArgsList} unsupported, use --help for details.`
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
