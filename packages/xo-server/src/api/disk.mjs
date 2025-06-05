import * as multiparty from 'multiparty'
import assert from 'assert'
import hrp from 'http-request-plus'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { format, JsonRpcError } from 'json-rpc-peer'
import { getStreamAsBuffer } from 'get-stream'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'stream'
import { peekFooterFromVhdStream } from 'vhd-lib'
import { vmdkToVhd } from 'xo-vmdk-to-vhd'

import { VDI_FORMAT_VHD, VDI_FORMAT_RAW } from '../xapi/index.mjs'
import { parseSize } from '../utils.mjs'
import { readChunk } from '@vates/read-chunk'

const log = createLogger('xo:disk')

// ===================================================================

export const create = defer(async function ($defer, { name, size, sr, vm, bootable, position, mode }) {
  const attach = vm !== undefined

  do {
    let resourceSet
    if (attach && (resourceSet = vm.resourceSet) != null) {
      try {
        await this.checkResourceSetConstraints(resourceSet, this.apiContext.user.id, [sr.id])
        await this.allocateLimitsInResourceSet({ disk: size }, resourceSet)
        $defer.onFailure(() => this.releaseLimitsInResourceSet({ disk: size }, resourceSet))

        break
      } catch (error) {
        if (!noSuchObject.is(error, { id: resourceSet })) {
          throw error
        }
      }

      // the resource set does not exist, falls back to normal check
    }

    await this.checkPermissions([[sr.id, 'administrate']])
  } while (false)

  const xapi = this.getXapi(sr)
  const vdi = await xapi._getOrWaitObject(
    await xapi.VDI_create({
      name_label: name,
      SR: sr._xapiRef,
      virtual_size: parseSize(size),
    })
  )
  $defer.onFailure(() => vdi.$destroy())

  if (attach) {
    await xapi.VBD_create({
      bootable,
      mode,
      userdevice: position,
      VDI: vdi.$ref,
      VM: vm._xapiRef,
    })
  }

  return vdi.$id
})

create.description = 'create a new disk on a SR'

create.params = {
  name: { type: 'string' },
  size: { type: ['integer', 'string'] },
  sr: { type: 'string' },
  vm: { type: 'string', optional: true },
  bootable: { type: 'boolean', optional: true },
  mode: { type: 'string', optional: true },
  position: { type: 'string', optional: true },
}

create.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  sr: ['sr', 'SR', false],
}

// -------------------------------------------------------------------

const VHD = 'vhd'
const VMDK = 'vmdk'
const QCOW2 = 'qcow2'

async function handleExportContent(req, res, { filename, format, nbdConcurrency, preferNbd, vdi }) {
  let stream
  switch (format) {
    case VMDK:
      stream = await vdi.$xapi.exportVdiAsVmdk(vdi.$id, filename, { nbdConcurrency, preferNbd })
      break
    case VHD:
      stream = await vdi.$exportContent({ format, nbdConcurrency, preferNbd })
      break
    case QCOW2:
      stream = await vdi.$xapi.exportVdiAsQcow2(vdi.$id, filename, { nbdConcurrency, preferNbd })
      break
    default:
      throw new Error(`format ${format} unsupported`)
  }

  req.on('close', () => stream.destroy())

  // stream can be an HTTP response, in this case, extract interesting data
  const { headers = {}, length, statusCode = 200, statusMessage = 'OK' } = stream

  // Set the correct disposition
  headers['content-disposition'] = 'attachment'

  // expose the stream length if known
  if (headers['content-length'] === undefined && length !== undefined) {
    headers['content-length'] = length
  }

  res.writeHead(statusCode, statusMessage != null ? statusMessage : '', headers)
  pipeline(stream, res, error => {
    if (error != null) {
      log.warn('disk.exportContent', { error })
    }
  })
}

export async function exportContent({ vdi, format = VHD, nbdConcurrency, preferNbd }) {
  const filename = (vdi.name_label || 'unknown') + '.' + format.toLocaleLowerCase()
  return {
    $getFrom: await this.registerHttpRequest(
      handleExportContent,
      {
        vdi: this.getXapiObject(vdi),
        filename,
        format,
        nbdConcurrency,
        preferNbd,
      },
      {
        suffix: `/${encodeURIComponent(filename)}`,
      }
    ),
  }
}

exportContent.description = 'export the content of a VDI'
exportContent.params = {
  id: { type: 'string' },
  format: { enum: [VMDK, VHD, QCOW2], optional: true },
  preferNbd: { type: 'boolean', optional: true },
  nbdConcurrency: { type: 'number', optional: true },
}
exportContent.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'view'],
}

// -------------------------------------------------------------------

async function handleImportContent(req, res, { vdi }) {
  // Timeout seems to be broken in Node 4.
  // See https://github.com/nodejs/node/issues/3319
  req.setTimeout(43200000) // 12 hours
  req.length = +req.headers['content-length']
  await vdi.$importContent(req, { format: VDI_FORMAT_VHD })
  res.end(format.response(0, true))
}

export async function importContent({ vdi }) {
  return {
    $sendTo: await this.registerHttpRequest(handleImportContent, {
      vdi: this.getXapiObject(vdi),
    }),
  }
}

importContent.description = 'import contents into a VDI'
importContent.params = {
  id: { type: 'string' },
}
importContent.resolve = {
  vdi: ['id', ['VDI'], 'operate'],
}

/**
 * here we expect to receive a POST in multipart/form-data
 * When importing a VMDK file:
 *  - The first parts are the tables in uint32 LE
 *    - grainLogicalAddressList : uint32 LE in VMDK blocks
 *    - grainFileOffsetList : uint32 LE in sectors, limits the biggest VMDK size to 2^41B (2^32 * 512B)
 *  - the last part is the vmdk file.
 */
async function handleImport(req, res, { type, name, description, vmdkData, srId, xapi }) {
  req.setTimeout(43200000) // 12 hours
  req.length = req.headers['content-length']
  let vhdStream, size
  await new Promise((resolve, reject) => {
    const promises = []
    const form = new multiparty.Form()
    form.on('error', reject)
    form.on('part', async part => {
      try {
        if (part.name !== 'file') {
          promises.push(
            (async () => {
              const buffer = await getStreamAsBuffer(part)
              vmdkData[part.name] = new Uint32Array(
                buffer.buffer,
                buffer.byteOffset,
                buffer.length / Uint32Array.BYTES_PER_ELEMENT
              )
            })()
          )
        } else {
          let diskFormat = VDI_FORMAT_VHD
          await Promise.all(promises)
          part.length = part.byteCount
          switch (type) {
            case 'vmdk':
              vhdStream = await vmdkToVhd(part, vmdkData.grainLogicalAddressList, vmdkData.grainFileOffsetList)
              size = vmdkData.capacity
              break
            case 'vhd':
              {
                const footer = await peekFooterFromVhdStream(part).catch(e => {
                  if (e instanceof assert.AssertionError) {
                    throw new JsonRpcError(`Vhd file had an invalid header ${e}`)
                  }
                  throw e
                })
                vhdStream = part
                size = footer.currentSize
              }
              break
            case 'iso':
              diskFormat = VDI_FORMAT_RAW
              vhdStream = part
              size = part.byteCount
              break
            default:
              throw new JsonRpcError(`Unknown disk type, expected "iso", "vhd" or "vmdk", got ${type}`)
          }

          const vdi = await xapi._getOrWaitObject(
            await xapi.VDI_create({
              name_description: description,
              name_label: name,
              SR: xapi.getObject(srId, 'SR').$ref,
              virtual_size: parseSize(size),
            })
          )
          try {
            await vdi.$importContent(vhdStream, { format: diskFormat })
            let buffer
            const CHUNK_SIZE = 1024 * 1024
            // drain remaining content ( padding .header)
            // didn't succeed to ensure the stream is completely consumed with resume/finished
            do {
              buffer = await readChunk(part, CHUNK_SIZE)
            } while (buffer?.length === CHUNK_SIZE)

            res.end(format.response(0, vdi.$id))
          } catch (e) {
            await vdi.$destroy()
            throw e
          }
          resolve()
        }
      } catch (e) {
        res.writeHead(500)
        res.end(format.error(0, new JsonRpcError(e.message)))
        // destroy the reader to stop the file upload
        req.destroy()
        reject(e)
      }
    })
    form.parse(req)
  })
}

// type is 'vhd', 'vmdk', 'raw' or 'iso'
async function importDisk({ sr, type, name, description, url, vmdkData }) {
  if (url !== undefined) {
    const isRaw = type === 'raw' || type === 'iso'
    if (!(isRaw || type === 'vhd')) {
      throw invalidParameters('URL import is only compatible with VHD and raw formats')
    }

    const stream = await hrp(url)
    const length = stream.headers['content-length']
    if (length !== undefined) {
      stream.length = length
    }

    sr = this.getXapiObject(sr)

    const vdiRef = await sr.$importVdi(stream, {
      format: isRaw ? VDI_FORMAT_RAW : VDI_FORMAT_VHD,
      name_label: name,
      name_description: description,
    })

    return await sr.$xapi.getField('VDI', vdiRef, 'uuid')
  }

  return {
    $sendTo: await this.registerHttpRequest(handleImport, {
      description,
      name,
      srId: sr._xapiId,
      type,
      vmdkData,
      xapi: this.getXapi(sr),
    }),
  }
}

export { importDisk as import }

importDisk.params = {
  description: { type: 'string', minLength: 0, optional: true },
  name: { type: 'string' },
  sr: { type: 'string' },
  url: { type: 'string', optional: true },
  type: { type: 'string' },
  vmdkData: {
    type: 'object',
    optional: true,
    properties: {
      capacity: { type: 'integer' },
    },
  },
}
importDisk.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}
