'use strict'

const { getSyncedHandler } = require('@xen-orchestra/fs')
const { openVhd, Constants } = require('vhd-lib')
const Disposable = require('promise-toolbox/Disposable')
const omit = require('lodash/omit')

function deepCompareObjects(src, dest, path) {
  for (const key of Object.keys(src)) {
    const srcValue = src[key]
    const destValue = dest[key]
    if (srcValue !== destValue) {
      const srcType = typeof srcValue
      const destType = typeof destValue
      if (srcType !== destType) {
        throw new Error(`key ${path + '/' + key} is of type *${srcType}* in source and *${destType}* in dest`)
      }

      if (srcType !== 'object') {
        throw new Error(`key ${path + '/' + key} is *${srcValue}* in source and *${destValue}* in dest`)
      }

      if (Buffer.isBuffer(srcValue)) {
        if (!(Buffer.isBuffer(destValue) && srcValue.equals(destValue))) {
          throw new Error(`key ${path + '/' + key} is buffer in source that does not equal dest`)
        }
      } else {
        deepCompareObjects(src[key], dest[key], path + '/' + key)
      }
    }
  }
}

module.exports = async function compare(args) {
  if (args.length < 4 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: compare <sourceRemoteUrl> <source VHD> <destionationRemoteUrl> <destination> `
  }
  const [sourceRemoteUrl, sourcePath, destRemoteUrl, destPath] = args

  await Disposable.use(async function* () {
    const sourceHandler = yield getSyncedHandler({ url: sourceRemoteUrl })
    const src = yield openVhd(sourceHandler, sourcePath)
    const destHandler = yield getSyncedHandler({ url: destRemoteUrl })
    const dest = yield openVhd(destHandler, destPath)

    // parent locator entries contains offset that can be different without impacting the vhd
    // we'll compare them later
    // table offset and checksum are also implementation specific
    const ignoredEntries = ['checksum', 'parentLocatorEntry', 'tableOffset']
    deepCompareObjects(omit(src.header, ignoredEntries), omit(dest.header, ignoredEntries), 'header')
    deepCompareObjects(src.footer, dest.footer, 'footer')

    await src.readBlockAllocationTable()
    await dest.readBlockAllocationTable()

    for (let i = 0; i < src.header.maxTableEntries; i++) {
      if (src.containsBlock(i)) {
        if (dest.containsBlock(i)) {
          const srcBlock = await src.readBlock(i)
          const destBlock = await dest.readBlock(i)

          if (!srcBlock.buffer.equals(destBlock.buffer)) {
            throw new Error(`Block  ${i} has different data in src and dest`)
          }
        } else {
          throw new Error(`Block  ${i} is present in source but not in dest `)
        }
      } else if (dest.containsBlock(i)) {
        throw new Error(`Block  ${i} is present in dest but not in source `)
      }
    }

    for (let parentLocatorId = 0; parentLocatorId < Constants.PARENT_LOCATOR_ENTRIES; parentLocatorId++) {
      const srcParentLocator = await src.readParentLocator(parentLocatorId)
      const destParentLocator = await dest.readParentLocator(parentLocatorId)
      if (!srcParentLocator.data || !srcParentLocator.data.equals(destParentLocator.data)) {
        console.log(srcParentLocator, destParentLocator)
        throw new Error(`Parent Locator  ${parentLocatorId} has different data in src and dest`)
      }
    }
    console.log('there is no difference between theses vhd')
  })
}
