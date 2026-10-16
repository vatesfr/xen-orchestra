import { test } from 'node:test'
import assert from 'node:assert'
import { buffer } from 'node:stream/consumers'
import tar from 'tar-stream'
import { xxhash64 } from 'hash-wasm'
import { Disk, RandomAccessDisk } from '@xen-orchestra/disk-transform'

import { toXvaStream } from './writeXva.mjs'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

const MiB = 1024 * 1024

/**
 * build a buffer filled with a pattern depending on the block index
 */
function blockData(index, blockSize) {
  return Buffer.alloc(blockSize, (index % 250) + 1)
}

class MemoryDisk extends RandomAccessDisk {
  #blockSize
  #virtualSize
  #indexes
  closed = false

  constructor({ blockSize, virtualSize, indexes }) {
    super()
    this.#blockSize = blockSize
    this.#virtualSize = virtualSize
    this.#indexes = indexes
  }
  getVirtualSize() {
    return this.#virtualSize
  }
  getBlockSize() {
    return this.#blockSize
  }
  async init() {}
  async close() {
    this.closed = true
  }
  isDifferencing() {
    return false
  }
  getBlockIndexes() {
    return this.#indexes
  }
  hasBlock(index) {
    return this.#indexes.includes(index)
  }
  async readBlock(index) {
    return { index, data: blockData(index, this.#blockSize) }
  }
}

// a Disk that can only be read sequentially through its generator
class StreamDisk extends Disk {
  #blockSize
  #virtualSize
  #indexes
  closed = false

  constructor({ blockSize, virtualSize, indexes }) {
    super()
    this.#blockSize = blockSize
    this.#virtualSize = virtualSize
    this.#indexes = indexes
  }
  getVirtualSize() {
    return this.#virtualSize
  }
  getBlockSize() {
    return this.#blockSize
  }
  async init() {}
  async close() {
    this.closed = true
  }
  isDifferencing() {
    return false
  }
  getBlockIndexes() {
    return this.#indexes
  }
  hasBlock(index) {
    return this.#indexes.includes(index)
  }
  async *buildDiskBlockGenerator() {
    for (const index of this.#indexes) {
      yield { index, data: blockData(index, this.#blockSize) }
    }
  }
}

/**
 * expected raw content of a disk
 */
function rawContent({ blockSize, virtualSize, indexes }, vdiSize = virtualSize) {
  const raw = Buffer.alloc(Math.ceil(vdiSize / XVA_DISK_CHUNK_LENGTH) * XVA_DISK_CHUNK_LENGTH, 0)
  for (const index of indexes) {
    const offset = index * blockSize
    if (offset < virtualSize) {
      blockData(index, blockSize).copy(raw, offset, 0, Math.min(blockSize, virtualSize - offset))
    }
  }
  return raw
}

/**
 * parse a XVA, check the structure and the hashes, and rebuild the disks content
 */
async function parseXva(stream) {
  const extract = tar.extract()
  stream.on('error', error => extract.destroy(error))
  stream.pipe(extract)
  const entries = []
  for await (const entry of extract) {
    entries.push({ name: entry.header.name, data: await buffer(entry) })
  }

  assert.strictEqual(entries[0].name, 'ova.xml', 'ova.xml must be the first entry')
  const ovaXml = entries[0].data.toString('utf8')

  const disks = {}
  for (let i = 1; i < entries.length; i += 2) {
    const chunk = entries[i]
    const hash = entries[i + 1]
    assert.strictEqual(hash.name, `${chunk.name}.xxhash`)
    assert.strictEqual(chunk.data.length, XVA_DISK_CHUNK_LENGTH)
    assert.strictEqual(hash.data.toString('utf8'), (await xxhash64(chunk.data)).toUpperCase())

    const match = /^(Ref:\d+)\/(\d{8})$/.exec(chunk.name)
    assert.notStrictEqual(match, null, `invalid chunk name ${chunk.name}`)
    const [, ref, counter] = match
    disks[ref] ??= []
    disks[ref].push({ index: Number(counter), data: chunk.data })
  }
  return { ovaXml, disks }
}

function checkDisk(chunks, expected) {
  const nbChunks = expected.length / XVA_DISK_CHUNK_LENGTH
  const indexes = chunks.map(({ index }) => index)
  assert.deepStrictEqual(
    indexes,
    indexes.slice().sort((a, b) => a - b),
    'chunks must be in increasing order'
  )
  assert.strictEqual(new Set(indexes).size, indexes.length, 'chunks must be unique')
  assert.strictEqual(indexes[0], 0, 'first chunk must be present')
  assert.strictEqual(indexes.at(-1), nbChunks - 1, 'last chunk must be present')

  const raw = Buffer.alloc(expected.length, 0)
  for (const { index, data } of chunks) {
    data.copy(raw, index * XVA_DISK_CHUNK_LENGTH)
  }
  assert.ok(raw.equals(expected), 'disk content must be preserved')
}

const VM = {
  name_label: 'xva test VM',
  memory: 256 * MiB,
  nCpus: 2,
  firmware: 'uefi',
}

test('write a VM with a random access disk with smaller blocks', async () => {
  const definition = { blockSize: 64 * 1024, virtualSize: 5 * MiB + 4096, indexes: [17, 18, 40, 79, 80] }
  const disk = new MemoryDisk(definition)
  const { ovaXml, disks } = await parseXva(toXvaStream({ ...VM, vdis: [{ name_label: 'disk A' }], disks: [disk] }))

  assert.ok(ovaXml.includes('<name>name_label</name><value>xva test VM</value>'))
  assert.ok(ovaXml.includes('<name>VCPUs_max</name><value>2</value>'))
  assert.ok(ovaXml.includes(`<name>memory_static_max</name><value>${256 * MiB}</value>`))
  assert.ok(ovaXml.includes('<name>firmware</name><value>uefi</value>'))
  assert.ok(ovaXml.includes('<name>name_label</name><value>disk A</value>'))
  // size is aligned to the XVA chunk size
  assert.ok(ovaXml.includes(`<name>virtual_size</name><value>${6 * MiB}</value>`))

  assert.deepStrictEqual(Object.keys(disks), ['Ref:002'])
  checkDisk(disks['Ref:002'], rawContent(definition))
  // empty chunks are skipped
  assert.deepStrictEqual(
    disks['Ref:002'].map(({ index }) => index),
    [0, 1, 2, 4, 5]
  )
  assert.strictEqual(disk.closed, true)
})

test('write a streamed disk with larger blocks', async () => {
  const definition = { blockSize: 4 * MiB, virtualSize: 10 * MiB, indexes: [1, 2] }
  const disk = new StreamDisk(definition)
  const { disks } = await parseXva(toXvaStream({ ...VM, vdis: [{}], disks: [disk] }))

  checkDisk(disks['Ref:002'], rawContent(definition))
  assert.strictEqual(disk.closed, true)
})

test('write a random access disk with unsorted indexes', async () => {
  const definition = { blockSize: MiB, virtualSize: 8 * MiB, indexes: [6, 2, 4] }
  const { disks } = await parseXva(toXvaStream({ ...VM, vdis: [{}], disks: [new MemoryDisk(definition)] }))
  checkDisk(disks['Ref:002'], rawContent(definition))
})

test('write an empty disk', async () => {
  const definition = { blockSize: MiB, virtualSize: 8 * MiB, indexes: [] }
  const { disks } = await parseXva(toXvaStream({ ...VM, vdis: [{}], disks: [new MemoryDisk(definition)] }))
  checkDisk(disks['Ref:002'], rawContent(definition))
  assert.strictEqual(disks['Ref:002'].length, 2)
})

test('write multiple disks', async () => {
  const definitionA = { blockSize: 2 * MiB, virtualSize: 4 * MiB, indexes: [0, 1] }
  const definitionB = { blockSize: 512 * 1024, virtualSize: 3 * MiB, indexes: [3] }
  const { ovaXml, disks } = await parseXva(
    toXvaStream({
      ...VM,
      vdis: [{ name_label: 'A' }, { name_label: 'B', virtual_size: 16 * MiB }],
      disks: [new MemoryDisk(definitionA), new StreamDisk(definitionB)],
    })
  )
  assert.ok(ovaXml.includes('<name>device</name><value>xvda</value>'))
  assert.ok(ovaXml.includes('<name>device</name><value>xvdb</value>'))
  // VDI can be bigger than its disk
  assert.ok(ovaXml.includes(`<name>virtual_size</name><value>${16 * MiB}</value>`))

  // Ref:000 is the VM, Ref:001 the SR, then VDI/VBD pairs
  assert.deepStrictEqual(Object.keys(disks), ['Ref:002', 'Ref:004'])
  checkDisk(disks['Ref:002'], rawContent(definitionA))
  // the last chunk of the VDI is present, even if the disk is smaller
  checkDisk(disks['Ref:004'], rawContent(definitionB, 16 * MiB))
})

test('reject a stream disk generating unordered blocks', async () => {
  const disk = new StreamDisk({ blockSize: MiB, virtualSize: 8 * MiB, indexes: [4, 2] })
  await assert.rejects(parseXva(toXvaStream({ ...VM, vdis: [{}], disks: [disk] })), /increasing order/)
  assert.strictEqual(disk.closed, true)
})

test('reject a disk with an incompatible block size', async () => {
  const disk = new MemoryDisk({ blockSize: 3 * 512 * 1024, virtualSize: 6 * MiB, indexes: [0] })
  await assert.rejects(parseXva(toXvaStream({ ...VM, vdis: [{}], disks: [disk] })), /XVA chunk size/)
})

test('reject a VDI smaller than its disk', async () => {
  const disk = new MemoryDisk({ blockSize: MiB, virtualSize: 6 * MiB, indexes: [0] })
  await assert.rejects(
    parseXva(toXvaStream({ ...VM, vdis: [{ virtual_size: MiB }], disks: [disk] })),
    /can't be smaller/
  )
})

test('reject a differencing disk', async () => {
  const disk = new MemoryDisk({ blockSize: MiB, virtualSize: 6 * MiB, indexes: [0] })
  disk.isDifferencing = () => true
  await assert.rejects(parseXva(toXvaStream({ ...VM, vdis: [{}], disks: [disk] })), /differencing/)
  assert.strictEqual(disk.closed, true)
})

test('describe the SR and the network with complete records', async () => {
  const sr = { uuid: 'sr-uuid', name_label: 'my SR', VDIs: ['OpaqueRef:existing'] }
  const network = { uuid: 'network-uuid', name_label: 'my network' }
  const { ovaXml } = await parseXva(
    toXvaStream(
      {
        ...VM,
        networks: [{ macAddress: '02:00:00:00:00:01', isGenerated: false }],
        vdis: [{}],
        disks: [new MemoryDisk({ blockSize: MiB, virtualSize: MiB, indexes: [0] })],
      },
      { sr, network }
    )
  )
  // xapi fails with "Field other_config not present in rpc" if a field is missing
  const srXml =
    /<member><name>class<\/name><value>SR<\/value><\/member>.*?<\/struct><\/value><\/member><\/struct><\/value>/.exec(
      ovaXml
    )[0]
  for (const field of ['other_config', 'sm_config', 'PBDs', 'content_type', 'physical_size']) {
    assert.ok(srXml.includes(`<name>${field}</name>`), `SR.${field} must be present`)
  }
  assert.ok(srXml.includes('<name>VDIs</name><value><array><data><value>Ref:002</value></data></array></value>'))
  assert.ok(ovaXml.includes('<name>VIFs</name><value><array><data><value>Ref:005</value></data></array></value>'))
  assert.ok(ovaXml.includes('<name>bridge</name>'))
  assert.ok(ovaXml.includes('<name>MAC</name><value>02:00:00:00:00:01</value>'))
  // the records passed by the caller are not mutated
  assert.deepStrictEqual(sr.VDIs, ['OpaqueRef:existing'])
  assert.strictEqual(network.VIFs, undefined)
})
