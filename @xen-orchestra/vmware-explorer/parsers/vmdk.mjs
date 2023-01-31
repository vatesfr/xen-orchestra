import { strictEqual } from 'node:assert'

// the vmdk files each  contains a disk metadata
export function parseDescriptor(text) {
  const descriptorText = text.toString('ascii').replace(/\x00+$/, '') // eslint-disable-line no-control-regex
  strictEqual(descriptorText.substr(0, 21), '# Disk DescriptorFile')
  const descriptorDict = {}
  const extentList = []
  const lines = descriptorText.split(/\r?\n/).filter(line => {
    return line.trim().length > 0 && line[0] !== '#'
  })
  for (const line of lines) {
    const defLine = line.split('=')
    // the wonky quote test is to avoid having an equal sign in the name of an extent
    if (defLine.length === 2 && defLine[0].indexOf('"') === -1) {
      descriptorDict[defLine[0].toLowerCase()] = defLine[1].replace(/['"]+/g, '')
    } else {
      const [, access, sizeSectors, type, name, offset] = line.match(/([A-Z]+) ([0-9]+) ([A-Z]+) "(.*)" ?(.*)$/)
      extentList.push({ access, sizeSectors, type, name, offset })
    }
  }
  strictEqual(extentList.length, 1, 'only one extent per vmdk is supported')
  return { ...descriptorDict, extent: extentList[0] }
}

// https://github.com/libyal/libvmdk/blob/main/documentation/VMWare%20Virtual%20Disk%20Format%20(VMDK).asciidoc#5-the-cowd-sparse-extent-data-file
// this parser will only handle vmdk files that contains the descriptor but not the data
// the data must be in a separated file ( fileName )
export default function parseVmdk(raw) {
  strictEqual(typeof raw, 'string')

  const descriptor = parseDescriptor(raw)
  const isFull = !descriptor.parentfilenamehint
  return {
    capacity: descriptor.extent.sizeSectors * 512,
    isFull,
    uid: descriptor.cid,
    fileName: descriptor.extent.name,
    parentId: descriptor.parentcid,
    parentFileName: descriptor.parentfilenamehint,
    vmdFormat: descriptor.extent.type,
    nameLabel: descriptor.extent.name,
  }
}

/** file content example
 *
# Disk DescriptorFile
version=1
encoding="UTF-8"
CID=d7980f7a
parentCID=ffffffff
isNativeSnapshot="no"
createType="vmfs"

# Extent description
RW 67108864 VMFS "test flo_0-flat.vmdk"

# The Disk Data Base
#DDB

ddb.adapterType = "lsilogic"
ddb.geometry.cylinders = "4177"
ddb.geometry.heads = "255"
ddb.geometry.sectors = "63"
ddb.longContentID = "741a56c9a09190258e814e7ed7980f7a"
ddb.thinProvisioned = "1"
ddb.toolsVersion = "2147483647"
ddb.uuid = "60 00 C2 90 6f ee 5b 7e-d5 51 99 ed 52 8e b8 b0"
ddb.virtualHWVersion = "11"
 */
