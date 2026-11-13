import { buffer } from 'node:stream/consumers'
import { createGzip, createZstdCompress } from 'node:zlib'
import { finished } from 'node:stream/promises'
import { pipeline } from 'node:stream'
import { createLogger } from '@xen-orchestra/log'
import { fromCallback } from 'promise-toolbox'
import tar from 'tar-stream'

import toOvaXml from './_toOvaXml.mjs'
import { formatBlockPath } from './_formatBlockPath.mjs'
import { parseOvaXml } from './_parseOvaXml.mjs'
import { readXvaEntries } from './_readXvaEntries.mjs'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

const { warn } = createLogger('xo:xva:parseXva')

const OVA_XML = 'ova.xml'
// Ref:002/00000012, followed by Ref:002/00000012.xxhash (.checksum holds a sha1 on older xapi)
const CHUNK_ENTRY_RE = /^(Ref:\d+)\/(\d{8})(\.xxhash|\.checksum)?$/
// VM.platform:hvm_serial
const KEY_TO_REMOVE_RE = /^([^.:]+)\.([^.:]+):(.+)$/

const noop = Function.prototype

async function addEntry(pack, name, data) {
  // the callback is only called once the pack has been drained: this handles back-pressure
  await fromCallback.call(pack, pack.entry, { name }, data)
}

async function drain(stream) {
  stream.resume()
  await finished(stream)
}

/**
 * a XVA whose ova.xml has been read: its records can be modified in place before being written back
 * with `toStream()`, the content of the disks is read sequentially from the source stream
 */
export class Xva {
  #chunksRead = false
  #entries
  #vdiRefs

  /** the version struct of ova.xml (xapi version, export_vsn, ...) */
  version
  /** all the objects of ova.xml, in order */
  objects
  /** the records of the objects, by class then by ref: records.VDI['Ref:002'] */
  records = {}

  constructor({ version, objects, entries }) {
    this.version = version
    this.objects = objects
    for (const { class: cls, id, snapshot } of objects) {
      ;(this.records[cls] ??= {})[id] = snapshot
    }
    this.#entries = entries
    this.#vdiRefs = new Set(Object.keys(this.vdis))
  }

  /** the VM record, when the XVA contains several VM objects the others are its snapshots */
  get vm() {
    const vms = Object.values(this.records.VM ?? {})
    return vms.find(vm => vm.is_a_snapshot !== true) ?? vms[0]
  }

  get vdis() {
    return (this.records.VDI ??= {})
  }

  get vbds() {
    return (this.records.VBD ??= {})
  }

  get vifs() {
    return (this.records.VIF ??= {})
  }

  /** the contents of the VTPMs, like the vtpms of an incremental VM */
  get vtpms() {
    return Object.values(this.records.VTPM ?? {}).map(({ contents }) => contents)
  }

  /**
   * remove keys from the maps of the records, e.g. 'VM.platform:hvm_serial' removes the key
   * hvm_serial of the platform field of the VM records
   *
   * the key is matched case-insensitively
   *
   * @param {string[]} keys as 'Class.field:key'
   * @returns {Array<{ class: string, ref: string, field: string, key: string, value: unknown }>} what has been removed
   */
  removeKeys(keys) {
    const removed = []
    for (const spec of keys) {
      const match = KEY_TO_REMOVE_RE.exec(spec)
      if (match === null) {
        throw new Error(`invalid key to remove ${spec}, expected Class.field:key`)
      }
      const [, cls, field, key] = match
      const lowerKey = key.toLowerCase()
      for (const [ref, record] of Object.entries(this.records[cls] ?? {})) {
        const map = record[field]
        if (map === null || typeof map !== 'object' || Array.isArray(map)) {
          continue
        }
        for (const name of Object.keys(map)) {
          if (name.toLowerCase() === lowerKey) {
            removed.push({ class: cls, ref, field, key: name, value: map[name] })
            delete map[name]
          }
        }
      }
    }
    return removed
  }

  /**
   * read the chunks of the disks, sequentially and in the order of the XVA: all the chunks of a VDI,
   * then the chunks of the next one
   *
   * the last chunk of a VDI may be shorter than the others, the hashes are not checked
   *
   * @returns {AsyncGenerator<{ ref: string, index: number, data: Buffer, hash?: { name: string, data: Buffer } }>} hash is the entry following the chunk in the XVA, as is
   */
  async *chunks() {
    if (this.#chunksRead) {
      throw new Error('the chunks of a XVA can only be read once')
    }
    this.#chunksRead = true

    // the last chunk read, its hash entry (if any) is the next entry
    let chunk
    for await (const entry of this.#entries) {
      const match = CHUNK_ENTRY_RE.exec(entry.name)
      if (match === null) {
        warn('ignoring unexpected entry', { name: entry.name })
        await drain(entry.stream)
        continue
      }
      const [name, ref, counter, hashExtension] = match
      if (hashExtension === undefined) {
        if (chunk !== undefined) {
          // the previous chunk has no hash entry
          yield chunk
        }
        if (!this.#vdiRefs.has(ref)) {
          throw new Error(`chunk ${name} does not belong to a VDI of the XVA`)
        }
        if (entry.size === 0 || entry.size > XVA_DISK_CHUNK_LENGTH) {
          throw new Error(`invalid size ${entry.size} for chunk ${name}`)
        }
        chunk = { ref, index: Number(counter), data: await buffer(entry.stream) }
      } else {
        const chunkName = name.slice(0, -hashExtension.length)
        if (chunk === undefined || formatBlockPath(chunk.ref, chunk.index) !== chunkName) {
          throw new Error(`hash entry ${name} does not follow its chunk`)
        }
        chunk.hash = { name, data: await buffer(entry.stream) }
        yield chunk
        chunk = undefined
      }
    }
    if (chunk !== undefined) {
      yield chunk
    }
  }

  /**
   * write a XVA from the current records and the chunks of the source, it can be called once, and not after chunks()
   *
   * the chunks and their hashes are copied as is, errors are forwarded to the returned stream
   *
   * @param {object} [opts]
   * @param {false|true|'gzip'|'zstd'} [opts.compress=false] same values as the compress param of xapi.VM_export
   * @returns {import('node:stream').Readable}
   */
  toStream({ compress = false } = {}) {
    const pack = tar.pack()
    this.#writeTo(pack).then(
      () => pack.finalize(),
      error => pack.destroy(error)
    )
    if (!compress) {
      return pack
    }
    const compressor = compress === 'zstd' ? createZstdCompress() : createGzip()
    // forward the errors, and stop reading the source if the consumer stops early
    pipeline(pack, compressor, noop)
    return compressor
  }

  async #writeTo(pack) {
    await addEntry(pack, OVA_XML, toOvaXml({ version: this.version, objects: this.objects }))
    for await (const { ref, index, data, hash } of this.chunks()) {
      await addEntry(pack, formatBlockPath(ref, index), data)
      if (hash !== undefined) {
        await addEntry(pack, hash.name, hash.data)
      }
    }
  }
}

/**
 * read the metadata of a XVA, compressed or not
 *
 * the disks are read afterwards from the same stream, with `chunks()` or `toStream()`
 *
 * @param {import('node:stream').Readable} stream
 * @returns {Promise<Xva>}
 */
export async function parseXva(stream) {
  const entries = readXvaEntries(stream)
  try {
    const { value: first, done } = await entries.next()
    if (done || first.name !== OVA_XML) {
      throw new Error(`${OVA_XML} must be the first entry of a XVA, got ${first?.name}`)
    }
    const { version, objects } = parseOvaXml((await buffer(first.stream)).toString('utf8'))
    return new Xva({ version, objects, entries })
  } catch (error) {
    await entries.return()
    throw error
  }
}
