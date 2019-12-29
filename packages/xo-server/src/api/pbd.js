// FIXME: too low level, should be removed.

// ===================================================================
// Delete

async function delete_({ PBD }) {
  // TODO: check if PBD is attached before
  await this.getXapi(PBD).callAsync('PBD.destroy', PBD._xapiRef)
}
export { delete_ as delete }

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  PBD: ['id', 'PBD', 'administrate'],
}

// ===================================================================
// Disconnect

export async function disconnect({ pbd }) {
  return this.getXapi(pbd).unplugPbd(pbd._xapiId)
}

disconnect.params = {
  id: { type: 'string' },
}

disconnect.resolve = {
  pbd: ['id', 'PBD', 'administrate'],
}

// ===================================================================
// Connect

export async function connect({ PBD }) {
  // TODO: check if PBD is attached before
  await this.getXapi(PBD).callAsync('PBD.plug', PBD._xapiRef)
}

connect.params = {
  id: { type: 'string' },
}

connect.resolve = {
  PBD: ['id', 'PBD', 'administrate'],
}
