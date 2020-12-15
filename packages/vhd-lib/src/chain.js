import { dirname, relative } from 'path'

import Vhd from './vhd'
import { DISK_TYPE_DIFFERENCING } from './_constants'

export default async function chain(parentHandler, parentPath, childHandler, childPath, force = false) {
  const parentVhd = new Vhd(parentHandler, parentPath)
  const childVhd = new Vhd(childHandler, childPath)

  await childVhd.readHeaderAndFooter()
  const { header, footer } = childVhd

  if (footer.diskType !== DISK_TYPE_DIFFERENCING) {
    if (!force) {
      throw new Error('cannot chain disk of type ' + footer.diskType)
    }
    footer.diskType = DISK_TYPE_DIFFERENCING
  }

  await Promise.all([childVhd.readBlockAllocationTable(), parentVhd.readHeaderAndFooter()])

  const parentName = relative(dirname(childPath), parentPath)
  header.parentUuid = parentVhd.footer.uuid
  header.parentUnicodeName = parentName
  await childVhd.setUniqueParentLocator(parentName)
  await childVhd.writeHeader()
  await childVhd.writeFooter()
}
