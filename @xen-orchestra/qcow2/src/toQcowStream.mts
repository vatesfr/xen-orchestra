import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { Readable } from 'node:stream'
const REFCOUNT_BYTES = 2 // the size of a reference count entries
const CLUSTER_SIZE = 64 * 1024

let offset = 0
function* trackAndYield(buffer: Buffer) {
  offset += buffer.length
  yield buffer
}

function getAlignedBuffer(length: number, value: number = 0) {
  const aligned = Math.ceil(length / CLUSTER_SIZE) * CLUSTER_SIZE
  return Buffer.alloc(aligned, value)
}

function computeAddressingSpace(disk: RandomAccessDisk, l2EntrySize: number): number {
  const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
  const nbL2PerL1Entry = CLUSTER_SIZE / l2EntrySize
  const nbL1Entries = Math.ceil(nbBlocks / nbL2PerL1Entry)
  let size = Math.ceil((nbL1Entries * 8) / CLUSTER_SIZE) * CLUSTER_SIZE
  for (let i = 0; i < nbL1Entries; i++) {
    for (let j = 0; j < nbL2PerL1Entry; j++) {
      let blockIndex = i * nbL1Entries + j
      if (blockIndex >= nbBlocks) {
        // last l2 table
        break
      }
      if (disk.hasBlock(blockIndex)) {
        size += CLUSTER_SIZE
        break
      }
    }
  }
  return size
}

function computeRefCountSize(disk: RandomAccessDisk, addressTableSize: number) {
  const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
  // refcount count all the clusters including itself
  // from https://github.com/qemu/qemu/blob/a9cd5bc6399a80fcf233ed0fffe6067b731227d8/scripts/qcow2-to-stdout.py#L218
  // Now we have a problem because allocated_refcount_blocks and allocated_refcount_tables...
  // (a) increase total_allocated_clusters, and
  // (b) need to be recalculated when total_allocated_clusters is increased
  // So we need to repeat the calculation as long as the numbers change
  const nbAllocatedClusters = 1 /*header */ + addressTableSize / CLUSTER_SIZE + nbBlocks
  const refCountsPerL2Table = Math.floor(CLUSTER_SIZE / 8)
  const refcountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES)
  let nbClustersL2 = Math.ceil(nbAllocatedClusters / refcountsPerCluster)
  let nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)
  while (true) {
    const newNbAllocatedClusters = nbAllocatedClusters + nbClustersL1 + nbClustersL2
    const newNbClustersL2 = Math.ceil(newNbAllocatedClusters / refcountsPerCluster)
    if (newNbClustersL2 > nbClustersL2) {
      nbClustersL2 = newNbClustersL2
      nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)
    } else {
      break
    }
  }
  return { refCountL1Size: nbClustersL1 * CLUSTER_SIZE, refCountL2Size: nbClustersL2 * CLUSTER_SIZE }
}

function* yieldRefCounts(nbRefCountBlocks: number, currentOffset: number) {
  const nbL2PerL1Entry = CLUSTER_SIZE / REFCOUNT_BYTES
  const nbL1Entries = Math.ceil(nbRefCountBlocks / nbL2PerL1Entry)

  const l1Table = getAlignedBuffer(nbL1Entries * 8)
  let l2Offset = currentOffset + l1Table.length
  for (let i = 0; i < nbL1Entries; i++) {
    l1Table.writeBigUint64BE(BigInt(l2Offset), i * 8)
    l2Offset += CLUSTER_SIZE
  }
  yield* trackAndYield(l1Table)

  for (let i = 0; i < nbRefCountBlocks; i++) {
    let l2Table = getAlignedBuffer(1) // one cluster
    for (let j = 0; j < nbL2PerL1Entry; j++) {
      let blockIndex = i * nbL1Entries + j
      if (blockIndex >= nbRefCountBlocks) {
        // last l2 table can be incomplete
        break
      }
      l2Table.writeUInt16BE(1, j * REFCOUNT_BYTES) // mark this this cluster is used once
    }
    yield* trackAndYield(l2Table)
  }
}

function* yieldAddressingTables(disk: RandomAccessDisk, currentOffset: number) {
  // first level contains the adress of the cluster containing the L2 corresponding table
  // seconde level contains the adresse
  const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
  const nbEntriesPerL2Table = CLUSTER_SIZE / 8
  const nbL1Entries = Math.ceil(nbBlocks / nbEntriesPerL2Table)
  const l1Table = getAlignedBuffer(nbL1Entries * 8)
  let l2Offset = currentOffset + l1Table.length

  //first pass, check which L2 tables are instatiated
  for (let i = 0; i < nbL1Entries; i++) {
    for (let j = 0; j < nbEntriesPerL2Table; j++) {
      let blockIndex = i * nbL1Entries + j
      if (blockIndex >= nbBlocks) {
        // last l2 table
        break
      }
      if (disk.hasBlock(blockIndex)) {
        l1Table.writeBigUint64BE(BigInt(l2Offset), i * 8)
        l2Offset += CLUSTER_SIZE
      }
    }
  }
  yield* trackAndYield(l1Table)

  // now the L2 addressing tables
  let dataClusterOffset = l2Offset
  for (let i = 0; i < nbL1Entries; i++) {
    let l2Table: Buffer
    for (let j = 0; j < nbEntriesPerL2Table; j++) {
      let blockIndex = i * nbL1Entries + j
      if (blockIndex >= nbBlocks) {
        // last l2 table
        break
      }
      if (disk.hasBlock(blockIndex)) {
        if (l2Table === undefined) {
          l2Table = getAlignedBuffer(1) // one cluster
        }
        l2Table.writeUInt16BE(1, j * REFCOUNT_BYTES) // this cluster is used once
        dataClusterOffset += CLUSTER_SIZE
      }
    }
    if (l2Table !== undefined) {
      yield* trackAndYield(l2Table)
    }
  }
}

export function toQcow2Stream(disk: RandomAccessDisk): Readable {
  // @todo ensure disk blck size is 64KB

  const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
  const addressTableSize = computeAddressingSpace(disk, 8)
  const { refCountL1Size, refCountL2Size } = computeRefCountSize(disk, addressTableSize)

  const header = getAlignedBuffer(1)
  header.writeUint32BE(0x514649fb, 0)
  header.writeUint32BE(2, 4) //version
  header.writeBigUint64BE(0n, 8) // backing_file_offset
  header.writeUInt32BE(0, 16) // backing_file_size
  header.writeUInt32BE(Math.log2(CLUSTER_SIZE), 20) // 64KB clusters
  header.writeBigUInt64BE(BigInt(disk.getVirtualSize()), 24)
  header.writeUInt32BE(0, 32) //crypt : none
  header.writeUInt32BE(Math.ceil((nbBlocks * 8) / CLUSTER_SIZE), 36) // number of entries in L1 addressing table
  header.writeBigUInt64BE(BigInt(header.length + refCountL1Size + refCountL2Size), 40) //l1 offset , after ref counts
  header.writeBigUInt64BE(BigInt(header.length), 48) //ref count offset
  header.writeUInt32BE(refCountL2Size / CLUSTER_SIZE, 56) //ref count size in clusters
  header.writeUInt32BE(0, 60) //nb_snapshots
  header.writeUInt32BE(0, 64) //snapshots_offset

  async function* generator() {
    yield header
    yield* yieldRefCounts(refCountL2Size, offset)
    yield* yieldAddressingTables(disk, offset)
    for (let i = 0; i < nbBlocks; i++) {
      if (disk.hasBlock(i)) {
        const data = await disk.readBlock(i)
        yield data
      }
    }
  }
  return Readable.from(generator(), { highWaterMark: 10 * 1024 * 1024, objectMode: false })
}
