// Creates a VUSB which will be plugged to the VM at its next restart
// Only one VUSB can be attached to a given USB_group, and up to six VUSB can be attached to a VM.
export async function create({ vm, usbGroup }) {
  const xapi = this.getXapi(vm)
  const vusbRef = await xapi.VUSB_create(vm._xapiRef, usbGroup._xapiRef)
  return xapi.getField('VUSB', vusbRef, 'uuid')
}

create.params = {
  vmId: { type: 'string' },
  usbGroupId: { type: 'string' },
}

create.resolve = {
  vm: ['vmId', 'VM', 'administrate'],
  usbGroup: ['usbGroupId', 'USB_group', 'administrate'],
}

// Unplug VUSB until next VM restart
export async function unplug({ vusb }) {
  await this.getXapi(vusb).VUSB_unplug(vusb._xapiRef)
}

unplug.params = {
  id: { type: 'string' },
}

unplug.resolve = {
  vusb: ['id', 'VUSB', 'administrate'],
}

export async function destroy({ vusb }) {
  await this.getXapi(vusb).VUSB_destroy(vusb._xapiRef)
}

destroy.params = {
  id: { type: 'string' },
}

destroy.resolve = {
  vusb: ['id', 'VUSB', 'administrate'],
}
