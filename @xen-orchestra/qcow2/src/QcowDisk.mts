import { Disk, DiskBlock, FileAccessor } from '@xen-orchestra/disk-transform'

import assert from 'node:assert'

interface Qcow2Header {
  magic: number
  version: number
  backing_file_offset: bigint
  backing_file_size: number
  cluster_bits: number
  size: bigint
  crypt_method: number
  l1_size: number
  l1_table_offset: bigint
  refcount_table_offset: bigint
  refcount_table_clusters: number
  nb_snapshots: number
  snapshots_offset: bigint
}

export abstract class QcowDisk extends Disk {
  #accessor: FileAccessor
  #path: string
  #qcowHeader: Qcow2Header | undefined
  #grainIndex = new Map<number, number>()

  #descriptor: number | undefined

  get qcowHeader(): Qcow2Header {
    if (this.#qcowHeader === undefined) {
      throw new Error('Call Init before reading the header')
    }
    return this.#qcowHeader
  }
  constructor(accessor: FileAccessor, path: string) {
    super()
    this.#accessor = accessor
    this.#path = path
  }

  getVirtualSize(): number {
    const size = this.qcowHeader.size
    assert.ok(size < Number.MAX_SAFE_INTEGER)
    return Number(size)
  }
  getBlockSize(): number {
    const clusterSize = 1 << this.qcowHeader.cluster_bits
    return clusterSize
  }

  isDifferencing(): boolean {
    return this.qcowHeader.backing_file_offset !== 0n
  }

  async init(): Promise<void> {
    this.#descriptor = await this.#accessor.open(this.#path)
    const buffer = Buffer.alloc(1024)
    await this.#accessor.read(this.#descriptor, buffer, 0)
    const header = (this.#qcowHeader = {
      magic: buffer.readUInt32BE(0),
      version: buffer.readUInt32BE(4),
      backing_file_offset: buffer.readBigUInt64BE(8),
      backing_file_size: buffer.readUInt32BE(16),
      cluster_bits: buffer.readUInt32BE(20),
      size: buffer.readBigUInt64BE(24),
      crypt_method: buffer.readUInt32BE(32),
      l1_size: buffer.readUInt32BE(36),
      l1_table_offset: buffer.readBigUInt64BE(40),
      refcount_table_offset: buffer.readBigUInt64BE(48),
      refcount_table_clusters: buffer.readUInt32BE(56),
      nb_snapshots: buffer.readUInt32BE(60),
      snapshots_offset: buffer.readBigUInt64BE(64),
    })

    const clusterSize = this.getBlockSize()

    const l1Table = Buffer.alloc(header.l1_size * 8)
    await this.#accessor.read(this.#descriptor, l1Table, Number(header.l1_table_offset))

    const l2TableBuffer = Buffer.alloc(clusterSize)
    for (let i = 0; i < header.l1_size; i++) {
      const l2Offset = l1Table.readBigUInt64BE(i * 8)

      if (l2Offset === 0n) {
        continue
      }
      assert.ok(l2Offset < Number.MAX_SAFE_INTEGER)

      await this.#accessor.read(this.#descriptor, l2TableBuffer, Number(l2Offset))
      for (let j = 0; j < clusterSize / 8; j++) {
        const clusterOffset = l2TableBuffer.readBigUInt64BE(j * 8)

        if (clusterOffset === 0n) {
          continue
        }
        assert.ok(clusterOffset < Number.MAX_SAFE_INTEGER)
        this.#grainIndex.set(i * (clusterSize / 8) + j, Number(clusterOffset))
      }
    }
  }
  getBlockIndexes(): Array<number> {
    return [...this.#grainIndex.keys()]
  }
  hasBlock(index: number): boolean {
    return this.#grainIndex.has(index)
  }
  buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> | AsyncGenerator<DiskBlock> {
    throw new Error('Method not implemented.')
  }

  async close(): Promise<void> {
    this.#descriptor && this.#accessor.close(this.#descriptor)
  }
}

/*
async function* readQcow2(filePath: string): AsyncGenerator<{ index: number, data: Buffer }> {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1024); // Lire l'en-tête (taille suffisante pour l'en-tête QCOW2)
    fs.readSync(fd, buffer, 0, buffer.length, 0);

    // Exemple de lecture de l'en-tête (simplifié)
    const header: Qcow2Header = {
        magic: buffer.readUInt32BE(0),
        version: buffer.readUInt32BE(4),
        backing_file_offset: buffer.readBigUInt64BE(8),
        backing_file_size: buffer.readUInt32BE(16),
        cluster_bits: buffer.readUInt32BE(20),
        size: buffer.readBigUInt64BE(24),
        crypt_method: buffer.readUInt32BE(32),
        l1_size: buffer.readUInt32BE(36),
        l1_table_offset: buffer.readBigUInt64BE(40),
        refcount_table_offset: buffer.readBigUInt64BE(48),
        refcount_table_clusters: buffer.readUInt32BE(56),
        nb_snapshots: buffer.readUInt32BE(60),
        snapshots_offset: buffer.readBigUInt64BE(64),
    };

    const clusterSize = 1 << header.cluster_bits;

    // Lire la table L1 (simplifié)
    const l1TableBuffer = Buffer.alloc(header.l1_size * 8);
    fs.readSync(fd, l1TableBuffer, 0, l1TableBuffer.length, Number(header.l1_table_offset));

    for (let i = 0; i < header.l1_size; i++) {
        const l2Offset = l1TableBuffer.readBigUInt64BE(i * 8);

        if (l2Offset === 0n) {
            continue; // Cluster non alloué
        }

        // Lire la table L2 (simplifié)
        const l2TableBuffer = Buffer.alloc(clusterSize);
        fs.readSync(fd, l2TableBuffer, 0, l2TableBuffer.length, Number(l2Offset));

        for (let j = 0; j < clusterSize / 8; j++) {
            const clusterOffset = l2TableBuffer.readBigUInt64BE(j * 8);

            if (clusterOffset === 0n) {
                continue; // Cluster non alloué
            }

            // Lire les données du cluster
            const clusterData = Buffer.alloc(clusterSize);
            fs.readSync(fd, clusterData, 0, clusterSize, Number(clusterOffset));

            yield { index: i * (clusterSize / 8) + j, data: clusterData };
        }
    }

    fs.closeSync(fd);
}
*/
