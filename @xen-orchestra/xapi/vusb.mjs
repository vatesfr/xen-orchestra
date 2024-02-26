import ignoreErrors from 'promise-toolbox/ignoreErrors'

export default class Vusb {
  async destroy(ref) {
    await ignoreErrors.call(this.call('VUSB.unplug', ref))
    await this.call('VUSB.destroy', ref)
  }
}
