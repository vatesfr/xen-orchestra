'use strict'

const { decorateClass } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { VDI_FORMAT_RAW } = require('./index.js')
const peekFooterFromStream = require('vhd-lib/peekFooterFromVhdStream')

const { warn } = require('@xen-orchestra/log').createLogger('xo:xapi:sr')

class Sr {
  async create({
    content_type = 'user', // recommended by Citrix
    device_config,
    host,
    name_description = '',
    name_label,
    physical_size = 0,
    shared,
    sm_config = {},
    type,
  }) {
    const ref = await this.call(
      'SR.create',
      host,
      device_config,
      physical_size,
      name_label,
      name_description,
      type,
      content_type,
      shared,
      sm_config
    )

    // https://developer-docs.citrix.com/projects/citrix-hypervisor-sdk/en/latest/xc-api-extensions/#sr
    this.setFieldEntry('SR', ref, 'other_config', 'auto-scan', 'true').catch(warn)

    return ref
  }

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
