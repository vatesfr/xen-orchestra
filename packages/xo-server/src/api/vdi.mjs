// FIXME: rename to disk.*

import reduce from 'lodash/reduce.js'
import { defer } from 'golike-defer'
import { invalidParameters } from 'xo-common/api-errors.js'

import { parseSize } from '../utils.mjs'

// ====================================================================

async function delete_({ vdi }) {
  const resourceSet = reduce(
    vdi.$VBDs,
    (resourceSet, vbd) => resourceSet || this.getObject(this.getObject(vbd, 'VBD').VM).resourceSet,
    undefined
  )

  await this.getXapiObject(vdi).$destroy()

  if (resourceSet !== undefined) {
    await this.releaseLimitsInResourceSet({ disk: vdi.size }, resourceSet)
  }
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
export const set = defer(async function ($defer, params) {
  const { vdi } = params
  const xapi = this.getXapi(vdi)
  const ref = vdi._xapiRef

  // Size.
  if ('size' in params) {
    let resourceSetId
    const size = parseSize(params.size)

    if (size < vdi.size) {
      throw invalidParameters(`cannot set new size (${size}) below the current size (${vdi.size})`)
    }

    const vbds = vdi.$VBDs
    if (
      vbds.length === 1 &&
      (resourceSetId = xapi.xo.getData(this.getObject(vbds[0], 'VBD').VM, 'resourceSet')) !== undefined
    ) {
      if (this.apiContext.permission !== 'admin') {
        await this.checkResourceSetConstraints(resourceSetId, this.apiContext.user.id)
      }

      await this.allocateLimitsInResourceSet({ disk: size - vdi.size }, resourceSetId)
      $defer.onFailure(() => this.releaseLimitsInResourceSet({ disk: size - vdi.size }, resourceSetId))
    } else {
      await this.checkPermissions([[vdi.$SR, 'operate']])
    }

    await xapi.resizeVdi(ref, size)
  }
  if ('cbt' in params) {
    params.cbt ? await xapi.call('VDI.enable_cbt', ref) : await xapi.call('VDI.disable_cbt', ref)
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

    for (const field of Array.isArray(fields) ? fields : [fields]) {
      await xapi.call(`VDI.set_${field}`, ref, `${params[param]}`)
    }
  }
})

set.params = {
  // Identifier of the VDI to update.
  id: { type: 'string' },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', minLength: 0, optional: true },

  // size of VDI
  size: { type: ['integer', 'string'], optional: true },

  cbt: { type: 'boolean', optional: true },
}

set.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
}

// -------------------------------------------------------------------

export async function migrate({ vdi, sr, removeSnapshotsBeforeMigrating, resourceSet }) {
  const xapi = this.getXapi(vdi)

  if (this.apiContext.permission !== 'admin') {
    if (resourceSet !== undefined) {
      await this.checkResourceSetConstraints(resourceSet, this.apiContext.user.id, [sr.id])
    } else {
      await this.checkPermissions([[sr.id, 'administrate']])
    }
  }

  await xapi.moveVdi(vdi._xapiRef, sr._xapiRef, removeSnapshotsBeforeMigrating)

  return true
}

migrate.params = {
  id: { type: 'string' },
  removeSnapshotsBeforeMigrating: { type: 'boolean', default: false },
  resourceSet: { type: 'string', optional: true },
  sr_id: { type: 'string' },
}

migrate.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
  sr: ['sr_id', 'SR', false],
}
