import {parseSize} from '../utils'

// ===================================================================

export async function create ({name, size, sr}) {
  const vdi = await this.getXAPI(sr).createVdi(parseSize(size), {
    name_label: name,
    sr
  })
  return vdi.$id
}

create.description = 'create a new disk on a SR'

create.params = {
  name: { type: 'string' },
  size: { type: 'string' },
  sr: { type: 'string', optional: true }
}

create.resolve = {
  sr: ['sr', 'SR', 'administrate']
}
