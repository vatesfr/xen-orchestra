import {parseSize} from '../utils'

// ===================================================================

export async function create ({name, size, sr}) {
  const xapi = this.getXAPI(sr)

  const ref = await xapi.call('VDI.create', {
    name_label: name,
    other_config: {},
    read_only: false,
    sharable: false,
    SR: sr.ref,
    type: 'user',
    virtual_size: String(parseSize(size))
  })

  return (await xapi.call('VDI.get_record', ref)).uuid
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
