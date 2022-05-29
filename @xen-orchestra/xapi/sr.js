'use strict'

const { decorateClass } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { VDI_FORMAT_RAW } = require('./index.js')
const peekFooterFromStream = require('vhd-lib/peekFooterFromVhdStream')

class Sr {
  async importVdi(
    $defer,
    ref,
    stream,
    { name_label = '[XO] Imported disk - ' + new Date().toISOString(), ...vdiCreateOpts } = {}
  ) {
    const footer = await peekFooterFromStream(stream)
    const vdiRef = await this.VDI_create({ ...vdiCreateOpts, name_label, SR: ref, virtual_size: footer.currentSize })
    $defer.onFailure.call(this, 'callAsync', 'VDI.destroy', vdiRef)
    await this.VDI_importContent(vdiRef, stream, { format: VDI_FORMAT_RAW })
    return vdiRef
  }
}
module.exports = Sr

decorateClass(Sr, { importVdi: defer })
