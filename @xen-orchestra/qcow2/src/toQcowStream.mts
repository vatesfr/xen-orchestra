import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { Readable } from 'node:stream'

export function toQcow2Stream(disk: RandomAccessDisk, { clusterSize = 65536, refcount_bits = 16 } = {}): Readable {
  const nbEntriesPerL2Table = clusterSize / 8
  const refcountsPerTable = clusterSize / 8
  const refcountsPerBlock = (clusterSize * 8) / refcount_bits
  const hdrRefcountBits = Math.log2(refcount_bits)

  let l1TableLength = Math.ceil(disk.getVirtualSize() / nbEntriesPerL2Table)
  // align to a clusterSize
  l1TableLength = Math.ceil(l1TableLength / clusterSize) * clusterSize
  const l2Tables = new Map<number, Buffer>()
  const index = disk.getBlockIndexes()
  index.sort()
  // first pass , compute the total length
  let length = 72 + l1TableLength
  for (let blockIndex of index) {
    const l2tableIndex = Math.floor(blockIndex / nbEntriesPerL2Table)
    if (!l2Tables.has(l2tableIndex)) {
      l2Tables.set(l2tableIndex, Buffer.alloc(clusterSize, 0))
      length += clusterSize
    }
    length += clusterSize
  }
  const qcowHeader = Buffer.alloc(71, 0)

  async function* generator() {
    yield qcowHeader // need to populate this
    //yield L1 refcount
    //yield L2 refcount

    const l1Table = Buffer.alloc(l1TableLength, 0)
    let offset = 72 + l1TableLength
    // compute l2 table  offsets
    for (const tableIndex of l2Tables.keys()) {
      l1Table.writeBigInt64BE(BigInt(offset), tableIndex * 8)
      offset += clusterSize
    }
    yield l1Table
    // compute block offsets in l2 tables
    // blocks will be after l2 tables
    for (let blockIndex of index) {
      const l2TableIndex = Math.floor(blockIndex / nbEntriesPerL2Table)
      const indexInL2Table = blockIndex % nbEntriesPerL2Table
      const l2Table = l2Tables.get(l2TableIndex)
      l2Table!.writeBigInt64BE(BigInt(offset), indexInL2Table * 8)
      offset += clusterSize
    }
    // send l2 table
    for (const table in l2Tables.values()) {
      yield table
    }
    // send blocks
    for (let blockIndex of index) {
      const { data } = await disk.readBlock(blockIndex)
      yield data
    }
  }

  return Readable.from(generator(), { highWaterMark: 10 * 1024 * 1024, objectMode: false })
}
