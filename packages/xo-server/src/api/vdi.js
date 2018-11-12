// FIXME: rename to disk.*

import { invalidParameters } from 'xo-common/api-errors'
import { isArray, reduce } from 'lodash'

import { parseSize } from '../utils'

// ====================================================================

export async function delete_ ({ vdi }) {
  const resourceSet = reduce(
    vdi.$VBDs,
    (resourceSet, vbd) =>
      resourceSet || this.getObject(this.getObject(vbd, 'VBD').VM).resourceSet,
    undefined
  )

  if (resourceSet !== undefined) {
    await this.allocateLimitsInResourceSet({ disk: -vdi.size }, resourceSet)
  }

  await this.getXapi(vdi).deleteVdi(vdi._xapiId)
}

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
}

export { delete_ as delete }

// -------------------------------------------------------------------

// FIXME: human readable strings should be handled.
export async function set (params) {
  const { vdi } = params
  const xapi = this.getXapi(vdi)
  const ref = vdi._xapiRef

  // Size.
  if ('size' in params) {
    let resourceSetId
    const size = parseSize(params.size)

    if (size < vdi.size) {
      throw invalidParameters(
        `cannot set new size (${size}) below the current size (${vdi.size})`
      )
    }

    const vbds = vdi.$VBDs
    if (
      vbds.length === 1 &&
      (resourceSetId = xapi.xo.getData(
        this.getObject(vbds[0], 'VBD').VM,
        'resourceSet'
      )) !== undefined
    ) {
      if (this.user.permission !== 'admin') {
        await this.checkResourceSetConstraints(resourceSetId, this.user.id)
      }

      await this.allocateLimitsInResourceSet(
        { disk: size - vdi.size },
        resourceSetId
      )
    } else {
      await this.checkPermissions(this.user.id, [[vdi.$SR, 'operate']])
    }

    await xapi.resizeVdi(ref, size)
  }

  // Other fields.
  const object = {
    name_label: 'name_label',
    name_description: 'name_description',
  }
  for (const param in object) {
    const fields = object[param]
    if (!(param in params)) {
      continue
    }

    for (const field of isArray(fields) ? fields : [fields]) {
      await xapi.call(`VDI.set_${field}`, ref, `${params[param]}`)
    }
  }
}

set.params = {
  // Identifier of the VDI to update.
  id: { type: 'string' },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', optional: true },

  // size of VDI
  size: { type: ['integer', 'string'], optional: true },
}

set.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
}

// -------------------------------------------------------------------

export async function migrate ({ vdi, sr }) {
  const xapi = this.getXapi(vdi)

  await xapi.moveVdi(vdi._xapiRef, sr._xapiRef)

  return true
}

migrate.params = {
  id: { type: 'string' },
  sr_id: { type: 'string' },
}

migrate.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
  sr: ['sr_id', 'SR', 'administrate'],
}
