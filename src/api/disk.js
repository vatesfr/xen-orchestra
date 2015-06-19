import {parseSize} from '../utils'

// ===================================================================

export async function create ({name, size, sr}) {
  const vdi = await this.getXAPI(sr).createVdi(sr.id, parseSize(size), {
    name_label: name
  })
  return vdi.$id
}

create.description = 'create a new disk on a SR'

create.params = {
  name: { type: 'string' },
  size: { type: 'string' },
  sr: { type: 'string' }
}

create.resolve = {
  sr: ['sr', 'SR', 'administrate']
}
