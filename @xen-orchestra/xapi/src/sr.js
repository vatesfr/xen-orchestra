const groupBy = require('lodash/groupBy')
const keyBy = require('lodash/keyBy')

module.exports = class Sr {
  async getUnhealthyVdiChainsLength(ref = this.pool.default_SR) {
    const vdiRefs = await this.getField('SR', ref, 'VDIs')
    const vdis = await this.getRecords('VDI', vdiRefs)
    const vdiByUuid = keyBy(vdis, 'uuid')

    const children = { __proto__: null }
    vdiRefs.forEach(ref => {
      const vdi = vdis[ref]
      const parent = vdi.sm_config['vhd-parent']
      if (parent !== undefined) {
        (children[parent] ?? (children[parent] = [])).push(vdi.uuid)
      }
    })


    const chainLengthByVdi = { __proto__: null }
    const computeChainLength = uuid

    const n = vdiRefs.length
    let i = 0
    while (i < n) {
      const ref = vdiRefs[i]
      const vdi = vdis[ref]
      const parent = vdi.sm_config['vhd_parent']
      let chainLength = 0
      if (parent !== undefined) {
        const parentChainLength = chainLengthByVdi[parent]
        if (parentChainLength === undefined) {

        }
      }
    }

    return children
  }
}
