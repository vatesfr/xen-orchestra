import createLogger from '@xen-orchestra/log'
import pump from 'pump'
import { format } from 'json-rpc-peer'
import { noSuchObject, unauthorized } from 'xo-common/api-errors'

import { parseSize } from '../utils'

const log = createLogger('xo:disk')

// ===================================================================

export async function create ({ name, size, sr, vm, bootable, position, mode }) {
  const attach = vm !== undefined

  do {
    let resourceSet
    if (attach && (resourceSet = vm.resourceSet) != null) {
      try {
        await this.checkResourceSetConstraints(resourceSet, this.user.id, [
          sr.id,
        ])
        await this.allocateLimitsInResourceSet({ disk: size }, resourceSet)

        break
      } catch (error) {
        if (!noSuchObject.is(error, { data: { id: resourceSet } })) {
          throw error
        }
      }

      // the resource set does not exist, falls back to normal check
    }

    if (!(await this.hasPermissions(this.user.id, [[sr.id, 'administrate']]))) {
      throw unauthorized()
    }
  } while (false)

  const xapi = this.getXapi(sr)
  const vdi = await xapi.createVdi({
    name_label: name,
    size,
    sr: sr._xapiId,
  })

  if (attach) {
    await xapi.createVbd({
      bootable,
      mode,
      userdevice: position,
      vdi: vdi.$id,
      vm: vm._xapiId,
    })
  }

  return vdi.$id
}

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

async function handleExportContent (req, res, { xapi, id }) {
  const stream = await xapi.exportVdiContent(id)
  req.on('close', () => stream.cancel())

  // Remove the filename as it is already part of the URL.
  stream.headers['content-disposition'] = 'attachment'

  res.writeHead(
    stream.statusCode,
    stream.statusMessage != null ? stream.statusMessage : '',
    stream.headers
  )
  pump(stream, res, error => {
    if (error != null) {
      log.warn(`disk.exportContent ${error}`)
    }
  })
}

export async function exportContent ({ vdi }) {
  return {
    $getFrom: await this.registerHttpRequest(
      handleExportContent,
      {
        id: vdi._xapiId,
        xapi: this.getXapi(vdi),
      },
      {
        suffix: `/${encodeURIComponent(vdi.name_label)}.vhd`,
      }
    ),
  }
}

exportContent.description = 'export the content of a VDI'
exportContent.params = {
  id: { type: 'string' },
}
exportContent.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'view'],
}

// -------------------------------------------------------------------

async function handleImportContent (req, res, { xapi, id }) {
  // Timeout seems to be broken in Node 4.
  // See https://github.com/nodejs/node/issues/3319
  req.setTimeout(43200000) // 12 hours

  try {
    await xapi.importVdiContent(id, req)
    res.end(format.response(0, true))
  } catch (e) {
    res.writeHead(500)
    res.end(format.error(0, new Error(e.message)))
  }
}

export async function importContent ({ vdi }) {
  return {
    $sendTo: await this.registerHttpRequest(handleImportContent, {
      id: vdi._xapiId,
      xapi: this.getXapi(vdi),
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

// -------------------------------------------------------------------

export async function resize ({ vdi, size }) {
  await this.getXapi(vdi).resizeVdi(vdi._xapiId, parseSize(size))
}

resize.description = 'resize an existing VDI'

resize.params = {
  id: { type: 'string' },
  size: { type: ['integer', 'string'] },
}

resize.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
}
