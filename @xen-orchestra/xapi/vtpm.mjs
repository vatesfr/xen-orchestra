import upperFirst from 'lodash/upperFirst.js'
import { incorrectState } from 'xo-common/api-errors.js'

export default class Vtpm {
  async create({ is_unique = false, VM, contents }) {
    const pool = this.pool

    // If VTPM.create is called on a pool that doesn't support VTPM, the errors aren't explicit.
    // See https://github.com/xapi-project/xen-api/issues/5186
    if (pool.restrictions.restrict_vtpm !== 'false') {
      throw incorrectState({
        actual: pool.restrictions.restrict_vtpm,
        expected: 'false',
        object: pool.uuid,
        property: 'restrictions.restrict_vtpm',
      })
    }

    try {
      const ref = await this.call('VTPM.create', VM, is_unique)
      if (contents !== undefined) {
        await this.call('VTPM.set_contents', ref, contents)
      }
      return ref
    } catch (error) {
      const { code, params } = error
      if (code === 'VM_BAD_POWER_STATE') {
        const [, expected, actual] = params
        // In `VM_BAD_POWER_STATE` errors, the power state is lowercased
        throw incorrectState({
          actual: upperFirst(actual),
          expected: upperFirst(expected),
          object: await this.getField('VM', VM, 'uuid'),
          property: 'power_state',
        })
      }

      throw error
    }
  }
}
