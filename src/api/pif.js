// ===================================================================
// Delete

async function delete_ ({PIF}) {
  // TODO: check if PIF is attached before
  await this.getXAPI(PIF).call('PIF.destroy', PIF.ref)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  PIF: ['id', 'PIF', 'administrate']
}

// ===================================================================
// Disconnect

export async function disconnect ({PIF}) {
  // TODO: check if PIF is attached before
  await this.getXAPI(PIF).call('PIF.unplug', PIF.ref)
}

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  PIF: ['id', 'PIF', 'administrate']
}
// ===================================================================
// Connect

export async function connect ({PIF}) {
  // TODO: check if PIF is attached before
  await this.getXAPI(PIF).call('PIF.plug', PIF.ref)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  PIF: ['id', 'PIF', 'administrate']
}
