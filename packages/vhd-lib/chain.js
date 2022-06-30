'use strict'

const { dirname, relative } = require('path')

const { openVhd } = require('./openVhd')
const { DISK_TYPES } = require('./_constants')
const { Disposable } = require('promise-toolbox')

module.exports = async function chain(parentHandler, parentPath, childHandler, childPath, force = false) {
  await Disposable.use(
    [openVhd(parentHandler, parentPath), openVhd(childHandler, childPath, { flags: 'r+' })],
    async ([parentVhd, childVhd]) => {
      await childVhd.readHeaderAndFooter()
      const { header, footer } = childVhd

      if (footer.diskType !== DISK_TYPES.DIFFERENCING) {
        if (!force) {
          throw new Error('cannot chain disk of type ' + footer.diskType)
        }
        footer.diskType = DISK_TYPES.DIFFERENCING
      }
      await childVhd.readBlockAllocationTable()

      const parentName = relative(dirname(childPath), parentPath)
      header.parentUuid = parentVhd.footer.uuid
      header.parentUnicodeName = parentName
      await childVhd.setUniqueParentLocator(parentName)
      await childVhd.writeHeader()
      await childVhd.writeFooter()
    }
  )
}
