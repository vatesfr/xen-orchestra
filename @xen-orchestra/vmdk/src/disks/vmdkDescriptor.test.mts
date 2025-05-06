// vmdkParser.test.ts

import assert from 'node:assert'
import { describe, it } from 'node:test'
import { parseVMDKDescriptor, VMDKDescriptor } from './vmdkDescriptor.mjs'

describe('VMDK Parser', () => {
  const sampleVMDK = `# Disk DescriptorFile
version=1
encoding="UTF-8"
CID=6ea734ed
parentCID=1155cbc5
isNativeSnapshot="no"
createType="vmfsSparse"
parentFileNameHint="ubuntu2_0.vmdk"
# Extent description
RW 16777216 VMFSSPARSE "ubuntu2_0-000002-delta.vmdk"

The Disk Data Base
#DDB

ddb.longContentID = "ef8faaaac0db02a498a56e016ea734ed"`

  it('should parse a valid VMDK descriptor', () => {
    const result = parseVMDKDescriptor(sampleVMDK)

    assert.strictEqual(result.createType, 'vmfsSparse')
    assert.strictEqual(result.parentFileNameHint, 'ubuntu2_0.vmdk')
    assert.strictEqual(result.cid, '6ea734ed')
    assert.strictEqual(result.extents.length, 1)

    const extent = result.extents[0]
    assert.strictEqual(extent.mode, 'RW')
    assert.strictEqual(extent.size, 16777216)
    assert.strictEqual(extent.type, 'VMFSSPARSE')
    assert.strictEqual(extent.fileName, 'ubuntu2_0-000002-delta.vmdk')
  })

  it('should throw an error for missing required fields', () => {
    const invalidVMDK = `# Disk DescriptorFile
version=1
encoding="UTF-8"`

    assert.throws(() => parseVMDKDescriptor(invalidVMDK), {
      message: 'Invalid VMDK descriptor file - missing required fields',
    })
  })

  it('should handle multiple extents', () => {
    const multiExtentVMDK = `createType="twoGbMaxExtentSparse"
CID=12345678
RW 8388608 SPARSE "file1.vmdk"
RW 8388608 SPARSE "file2.vmdk"`

    const result = parseVMDKDescriptor(multiExtentVMDK)
    assert.strictEqual(result.extents.length, 2)
    assert.strictEqual(result.extents[0].fileName, 'file1.vmdk')
    assert.strictEqual(result.extents[1].fileName, 'file2.vmdk')
  })

  it('should handle different extent modes', () => {
    const mixedModeVMDK = `createType="monolithicSparse"
CID=abcdef12
RW 16777216 SPARSE "rw.vmdk"
RD 16777216 SPARSE "rd.vmdk"
NOACCESS 16777216 SPARSE "na.vmdk"`

    const result = parseVMDKDescriptor(mixedModeVMDK)
    assert.strictEqual(result.extents[0].mode, 'RW')
    assert.strictEqual(result.extents[1].mode, 'RD')
    assert.strictEqual(result.extents[2].mode, 'NOACCESS')
  })

  it('should get the offset if any ', () => {
    const commentHeavyVMDK = `
createType="commented"
CID=commentcid

# Extent section
RW 100 SPARSE "commented.vmdk" 12345`

    const result = parseVMDKDescriptor(commentHeavyVMDK)
    assert.strictEqual(result.extents.length, 1)
    assert.strictEqual(result.extents[0].offset, 12345)
  })
})
