import {parseSize} from '../utils'

// ===================================================================

export async function create ({name, size, sr}) {
  const vdi = await this.getXapi(sr).createVdi(parseSize(size), {
    name_label: name,
    sr: sr._xapiId
  })
  return vdi.$id
}

create.description = 'create a new disk on a SR'

create.params = {
  name: { type: 'string' },
  size: { type: ['integer', 'string'] },
  sr: { type: 'string' }
}

create.resolve = {
  sr: ['sr', 'SR', 'administrate']
}

// -------------------------------------------------------------------

export async function resize ({ vdi, size }) {
  await this.getXapi(vdi).resizeVdi(vdi._xapiId, parseSize(size))
}

resize.description = 'resize an existing VDI'

resize.params = {
  id: { type: 'string' },
  size: { type: ['integer', 'string'] }
}

resize.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate']
}
