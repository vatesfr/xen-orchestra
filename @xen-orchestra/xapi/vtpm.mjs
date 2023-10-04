import { incorrectState } from 'xo-common/api-errors.js'

export default class Vtpm {
  async create(vmRef) {
    const powerState = await this.getField('VM', vmRef, 'power_state')
    if (powerState !== 'Halted') {
      throw incorrectState({
        actual: powerState,
        expected: 'Halted',
        object: await this.getField('VM', vmRef, 'uuid'),
        property: 'power_state',
      })
    }

    const pool = this.pool
    if (pool.restrictions.restrict_vtpm !== 'false') {
      throw incorrectState({
        actual: pool.restrictions.restrict_vtpm,
        expected: 'false',
        object: pool.uuid,
        property: 'restrictions.restrict_vtpm',
      })
    }
    return this.call(
      'VTPM.create',
      vmRef,
      false // is_unique,
    )
  }

  destroy(vtpmRef) {
    return this.call('VTPM.destroy', vtpmRef)
  }
}
