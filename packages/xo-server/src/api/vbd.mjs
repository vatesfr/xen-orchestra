// FIXME: too low level, should be removed.

async function delete_({ vbd }) {
  await this.getXapiObject(vbd).$destroy()

  const vdi = this.getObject(vbd.VDI)
  const vm = this.getObject(vbd.VM)

  const { resourceSet } = vm
  if (resourceSet != null) {
    await this.releaseLimitsInResourceSet({ disk: vdi.size }, resourceSet)
  }
}

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

export { delete_ as delete }

// -------------------------------------------------------------------

export async function disconnect({ vbd }) {
  await this.getXapiObject(vbd).$unplug()
}

disconnect.params = {
  id: { type: 'string' },
}

disconnect.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

// -------------------------------------------------------------------

export async function connect({ vbd }) {
  const xapi = this.getXapi(vbd)
  await xapi.connectVbd(vbd._xapiRef)
}

connect.params = {
  id: { type: 'string' },
}

connect.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

// -------------------------------------------------------------------

export async function set({ position, vbd }) {
  if (position !== undefined) {
    await this.getXapiObject(vbd).set_userdevice(String(position))
  }
}

set.params = {
  // Identifier of the VBD to update.
  id: { type: 'string' },

  position: { type: ['string', 'number'], optional: true },
}

set.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

// -------------------------------------------------------------------

export async function setBootable({ vbd, bootable }) {
  await this.getXapiObject(vbd).set_bootable(bootable)
}

setBootable.params = {
  vbd: { type: 'string' },
  bootable: { type: 'boolean' },
}

setBootable.resolve = {
  vbd: ['vbd', 'VBD', 'administrate'],
}
