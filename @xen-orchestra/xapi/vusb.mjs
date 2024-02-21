import ignoreErrors from 'promise-toolbox/ignoreErrors'

export default class Vusb {
  async create(VM, USB_group) {
    return this.call('VUSB.create', VM, USB_group)
  }

  async unplug(ref) {
    await this.call('VUSB.unplug', ref)
  }

  async destroy(ref) {
    await ignoreErrors.call(this.VUSB_unplug(ref))
    await this.call('VUSB.destroy', ref)
  }
}
