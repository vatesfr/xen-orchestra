// FIXME: too low level, should be removed.

// ===================================================================
// Delete

async function delete_ ({PBD}) {
  // TODO: check if PBD is attached before
  await this.getXAPI(PBD).call('PBD.destroy', PBD._xapiRef)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  PBD: ['id', 'PBD', 'administrate']
}

// ===================================================================
// Disconnect

export async function disconnect ({PBD}) {
  // TODO: check if PBD is attached before
  await this.getXAPI(PBD).call('PBD.unplug', PBD._xapiRef)
}

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  PBD: ['id', 'PBD', 'administrate']
}

// ===================================================================
// Connect

export async function connect ({PBD}) {
  // TODO: check if PBD is attached before
  await this.getXAPI(PBD).call('PBD.plug', PBD._xapiRef)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  PBD: ['id', 'PBD', 'administrate']
}
