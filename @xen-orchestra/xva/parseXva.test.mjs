import { test } from 'node:test'
import assert from 'node:assert'
import { buffer } from 'node:stream/consumers'
import { createGzip, createZstdCompress } from 'node:zlib'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { fromCallback } from 'promise-toolbox'
import { xxhash64 } from 'hash-wasm'
import tar from 'tar-stream'

import toOvaXml from './_toOvaXml.mjs'
import { parseXva } from './parseXva.mjs'
import { detectCompression } from './_readXvaEntries.mjs'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

const MiB = 1024 * 1024

// the ova.xml of a VM with 2 disks, like xapi writes it
function ovaXml() {
  return toOvaXml({
    version: { hostname: 'host', export_vsn: 2 },
    objects: [
      {
        class: 'VM',
        id: 'Ref:0',
        snapshot: {
          uuid: 'vm-uuid',
          name_label: 'vm',
          is_a_snapshot: false,
          VBDs: ['Ref:3', 'Ref:5'],
          VIFs: ['Ref:7'],
          other_config: { is_system_domain: 'true', base_template_name: 'Debian' },
          platform: { HVM_serial: 'pty', viridian: 'true' },
          suspend_VDI: 'OpaqueRef:NULL',
          snapshot_time: new Date(0),
        },
      },
      { class: 'SR', id: 'Ref:1', snapshot: { uuid: 'sr-uuid', VDIs: ['Ref:2', 'Ref:4'] } },
      { class: 'VDI', id: 'Ref:2', snapshot: { uuid: 'vdi-a', virtual_size: 2 * MiB, SR: 'Ref:1' } },
      { class: 'VBD', id: 'Ref:3', snapshot: { VM: 'Ref:0', VDI: 'Ref:2', other_config: { 'backend-local': 'x' } } },
      // the size of this VDI is not aligned to the chunk size: its last chunk is shorter
      { class: 'VDI', id: 'Ref:4', snapshot: { uuid: 'vdi-b', virtual_size: MiB + 4096, SR: 'Ref:1' } },
      { class: 'VBD', id: 'Ref:5', snapshot: { VM: 'Ref:0', VDI: 'Ref:4', other_config: {} } },
      { class: 'network', id: 'Ref:6', snapshot: { uuid: 'net-uuid', VIFs: ['Ref:7'] } },
      { class: 'VIF', id: 'Ref:7', snapshot: { VM: 'Ref:0', network: 'Ref:6', MAC: '02:00:00:00:00:01' } },
      { class: 'VTPM', id: 'Ref:8', snapshot: { VM: 'Ref:0', contents: 'tpm-data' } },
    ],
  })
}

const chunkData = (fill, length = XVA_DISK_CHUNK_LENGTH) => Buffer.alloc(length, fill + 1)

const CHUNKS = [
  { ref: 'Ref:2', index: 0, data: chunkData(0) },
  { ref: 'Ref:2', index: 1, data: chunkData(1) },
  { ref: 'Ref:4', index: 0, data: chunkData(2) },
  { ref: 'Ref:4', index: 1, data: chunkData(3, 4096) },
]

const chunkName = ({ ref, index }) => `${ref}/${String(index).padStart(8, '0')}`

async function xxhashEntry(name, data) {
  return { name: `${name}.xxhash`, data: Buffer.from((await xxhash64(data)).toUpperCase()) }
}

function sha1Entry(name, data) {
  return { name: `${name}.checksum`, data: Buffer.from(createHash('sha1').update(data).digest('hex')) }
}

async function xvaEntries({ hash = xxhashEntry, extra = [], chunks = CHUNKS } = {}) {
  const entries = [{ name: 'ova.xml', data: Buffer.from(ovaXml()) }, ...extra]
  for (const chunk of chunks) {
    const name = chunkName(chunk)
    entries.push({ name, data: chunk.data })
    if (hash !== null) {
      entries.push(await hash(name, chunk.data))
    }
  }
  return entries
}

async function packEntries(entries) {
  const pack = tar.pack()
  // the pack must be read while the entries are written: an entry callback waits for the pack to be drained
  const packed = buffer(pack)
  for (const { name, data } of entries) {
    await fromCallback.call(pack, pack.entry, { name }, data)
  }
  pack.finalize()
  return packed
}

// a byte stream delivering small pieces, like a file or a network stream
function toStream(buf, pieceLength = 64 * 1024) {
  const pieces = []
  for (let offset = 0; offset < buf.length; offset += pieceLength) {
    pieces.push(buf.subarray(offset, offset + pieceLength))
  }
  return Readable.from(pieces, { objectMode: false })
}

const xvaStream = async opts => toStream(await packEntries(await xvaEntries(opts)))

async function collect(xva) {
  const chunks = []
  for await (const chunk of xva.chunks()) {
    chunks.push(chunk)
  }
  return chunks
}

function assertSameChunks(chunks, expected = CHUNKS) {
  assert.deepStrictEqual(
    chunks.map(({ ref, index, data }) => ({ ref, index, length: data.length })),
    expected.map(({ ref, index, data }) => ({ ref, index, length: data.length }))
  )
  chunks.forEach((chunk, i) => assert.ok(chunk.data.equals(expected[i].data), `content of chunk ${i}`))
}

function assertMetadata(xva) {
  assert.deepStrictEqual(xva.version, { hostname: 'host', export_vsn: '2' })
  assert.strictEqual(xva.objects.length, 9)
  assert.strictEqual(xva.vm.name_label, 'vm')
  assert.deepStrictEqual(Object.keys(xva.vdis), ['Ref:2', 'Ref:4'])
  assert.strictEqual(xva.vdis['Ref:4'].virtual_size, String(MiB + 4096))
  assert.strictEqual(xva.vbds['Ref:3'].VDI, 'Ref:2')
  assert.strictEqual(xva.vifs['Ref:7'].MAC, '02:00:00:00:00:01')
  assert.strictEqual(xva.records.network['Ref:6'].uuid, 'net-uuid')
  assert.deepStrictEqual(xva.vtpms, ['tpm-data'])
}

test('reads the metadata and the chunks of a XVA', async () => {
  const xva = await parseXva(await xvaStream())
  assertMetadata(xva)
  const chunks = await collect(xva)
  assertSameChunks(chunks)
  assert.deepStrictEqual(
    chunks.map(({ hash }) => hash.name),
    CHUNKS.map(chunk => `${chunkName(chunk)}.xxhash`)
  )
  assert.strictEqual(chunks[0].hash.data.toString(), (await xxhash64(CHUNKS[0].data)).toUpperCase())
})

for (const [compression, compress] of [
  ['gzip', createGzip],
  ['zstd', createZstdCompress],
]) {
  test(`reads a ${compression} compressed XVA`, async () => {
    const compressed = await buffer((await xvaStream()).pipe(compress()))
    assert.strictEqual(await detectCompression(toStream(compressed)), compression)
    const xva = await parseXva(toStream(compressed))
    assertMetadata(xva)
    assertSameChunks(await collect(xva))
  })
}

test('accepts sha1 checksums, chunks without hash, and ignores unknown entries', async () => {
  const sha1 = await parseXva(
    await xvaStream({ hash: sha1Entry, extra: [{ name: 'checksum.xml', data: Buffer.from('?') }] })
  )
  const chunks = await collect(sha1)
  assertSameChunks(chunks)
  assert.strictEqual(chunks[3].hash.name, 'Ref:4/00000001.checksum')

  const noHash = await parseXva(await xvaStream({ hash: null }))
  const chunksWithoutHash = await collect(noHash)
  assertSameChunks(chunksWithoutHash)
  assert.ok(chunksWithoutHash.every(({ hash }) => hash === undefined))
})

test('rejects an invalid XVA', async () => {
  await assert.rejects(
    parseXva(toStream(await packEntries([{ name: 'foo', data: Buffer.alloc(1) }]))),
    /ova.xml must be the first/
  )
  await assert.rejects(parseXva(toStream(Buffer.alloc(2048, 'x'))))

  const unknownVdi = await parseXva(await xvaStream({ chunks: [{ ref: 'Ref:9', index: 0, data: chunkData(0) }] }))
  await assert.rejects(collect(unknownVdi), /does not belong to a VDI/)

  const tooBig = await parseXva(await xvaStream({ chunks: [{ ref: 'Ref:2', index: 0, data: chunkData(0, MiB + 1) }] }))
  await assert.rejects(collect(tooBig), /invalid size/)

  const orphanHash = await parseXva(
    toStream(
      await packEntries([
        { name: 'ova.xml', data: Buffer.from(ovaXml()) },
        { name: 'Ref:2/00000000.xxhash', data: Buffer.from('0') },
      ])
    )
  )
  await assert.rejects(collect(orphanHash), /does not follow its chunk/)

  // cut in the middle of a chunk
  const truncated = await parseXva(toStream((await packEntries(await xvaEntries())).subarray(0, 2.5 * MiB)))
  await assert.rejects(collect(truncated), /Unexpected end of data/)

  const twice = await parseXva(await xvaStream())
  await collect(twice)
  await assert.rejects(collect(twice), /only be read once/)
})

const KEYS_TO_REMOVE = ['VBD.other_config:backend-local', 'VM.other_config:is_system_domain', 'VM.platform:hvm_serial']

test('removes keys from the records', async () => {
  const xva = await parseXva(await xvaStream())
  // the keys are matched case-insensitively, unknown classes and fields are ignored
  const removed = xva.removeKeys([...KEYS_TO_REMOVE, 'VM.foo:bar', 'VGPU.other_config:bar'])
  assert.deepStrictEqual(removed, [
    { class: 'VBD', ref: 'Ref:3', field: 'other_config', key: 'backend-local', value: 'x' },
    { class: 'VM', ref: 'Ref:0', field: 'other_config', key: 'is_system_domain', value: 'true' },
    { class: 'VM', ref: 'Ref:0', field: 'platform', key: 'HVM_serial', value: 'pty' },
  ])
  assert.deepStrictEqual(xva.vm.other_config, { base_template_name: 'Debian' })
  assert.deepStrictEqual(xva.vm.platform, { viridian: 'true' })
  assert.deepStrictEqual(xva.vbds['Ref:3'].other_config, {})
  assert.deepStrictEqual(xva.removeKeys(KEYS_TO_REMOVE), [])

  assert.throws(() => xva.removeKeys(['hvm_serial']), /expected Class.field:key/)
})

for (const compress of [false, 'gzip', 'zstd']) {
  test(`writes back a valid XVA, compressed with ${compress}`, async () => {
    const xva = await parseXva(await xvaStream({ hash: sha1Entry }))
    xva.removeKeys(KEYS_TO_REMOVE)
    xva.vm.name_label = 'cleaned'
    const output = await buffer(xva.toStream({ compress }))
    assert.strictEqual(await detectCompression(toStream(output)), compress || undefined)

    const copy = await parseXva(toStream(output))
    assert.strictEqual(copy.vm.name_label, 'cleaned')
    assert.deepStrictEqual(copy.vm.platform, { viridian: 'true' })
    assert.deepStrictEqual(copy.vm.other_config, { base_template_name: 'Debian' })
    assert.deepStrictEqual(copy.vbds['Ref:3'].other_config, {})
    assert.deepStrictEqual(copy.vtpms, ['tpm-data'])
    assert.strictEqual(copy.objects.length, 9)
    const chunks = await collect(copy)
    assertSameChunks(chunks)
    // the hashes are copied as is
    for (const [i, chunk] of chunks.entries()) {
      assert.deepStrictEqual(chunk.hash, sha1Entry(chunkName(CHUNKS[i]), CHUNKS[i].data))
    }
  })
}

test('forwards the errors of the source to the written XVA', async () => {
  const truncated = await parseXva(toStream((await packEntries(await xvaEntries())).subarray(0, 2.5 * MiB)))
  await assert.rejects(buffer(truncated.toStream({ compress: 'gzip' })), /Unexpected end of data/)

  const alreadyRead = await parseXva(await xvaStream())
  await collect(alreadyRead)
  await assert.rejects(buffer(alreadyRead.toStream()), /only be read once/)
})
