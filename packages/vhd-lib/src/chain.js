import { dirname, relative } from 'path'

import { openVhd } from './'
import { DISK_TYPES } from './_constants'
import { Disposable } from 'promise-toolbox'

export default async function chain(parentHandler, parentPath, childHandler, childPath, force = false) {
  await Disposable.use(
    [openVhd(parentHandler, parentPath), openVhd(childHandler, childPath)],
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
