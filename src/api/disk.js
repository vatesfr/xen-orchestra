import { parseSize } from '../utils'
import { unauthorized } from 'xo-common/api-errors'

// ===================================================================

export async function create ({ name, size, sr, vm, bootable, position, mode }) {
  const attach = vm !== undefined

  let resourceSet
  if (attach && (resourceSet = vm.resourceSet) != null) {
    await this.checkResourceSetConstraints(resourceSet, this.user.id, [ sr.id ])
    await this.allocateLimitsInResourceSet({ disk: size }, resourceSet)
  } else if (!(await this.hasPermissions(this.user.id, [ [ sr.id, 'administrate' ] ]))) {
    throw unauthorized()
  }

  const xapi = this.getXapi(sr)
  const vdi = await xapi.createVdi(parseSize(size), {
    name_label: name,
    sr: sr._xapiId,
  })

  if (attach) {
    await xapi.attachVdiToVm(vdi.$id, vm._xapiId, {
      bootable,
      position,
      readOnly: mode === 'RO',
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
