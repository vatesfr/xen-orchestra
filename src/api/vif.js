async function delete_ ({vif}) {
  // TODO: check if VIF is attached before
  await this.getXAPI(vif).call('VIF.destroy', vif.ref)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  vif: ['id', 'VIF', 'administrate']
}

// -------------------------------------------------------------------

export async function disconnect ({vif}) {
  // TODO: check if VIF is attached before
  await this.getXAPI(vif).call('VIF.unplug_force', vif.ref)
}

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vif: ['id', 'VIF', 'operate']
}

// -------------------------------------------------------------------

export async function connect ({vif}) {
  // TODO: check if VIF is attached before
  await this.getXAPI(vif).call('VIF.plug', vif.ref)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vif: ['id', 'VIF', 'operate']
}
