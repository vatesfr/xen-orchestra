import pump from 'pump'
import { unauthorized } from 'xo-common/api-errors'

import { parseSize } from '../utils'

// ===================================================================

export async function create ({ name, size, sr, vm, bootable, position, mode }) {
  const attach = vm !== undefined

  let resourceSet
  if (attach && (resourceSet = vm.resourceSet) != null) {
    await this.checkResourceSetConstraints(resourceSet, this.user.id, [sr.id])
    await this.allocateLimitsInResourceSet({ disk: size }, resourceSet)
  } else if (
    !(await this.hasPermissions(this.user.id, [[sr.id, 'administrate']]))
  ) {
    throw unauthorized()
  }

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
  pump(stream, res)
}

export async function exportContent ({ vdi }) {
  return {
    $getFrom: await this.registerHttpRequest(handleExportContent, {
      id: vdi._xapiId,
      xapi: this.getXapi(vdi),
    }, {
      suffix: `/${encodeURIComponent(vdi.name_label)}.vhd`
    }),
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
