/* eslint-env jest */

import { xo } from './util'

// ===================================================================

describe('role', () => {
  describe('.getAll()', () => {
    it(' returns all the roles', async () => {
      const role = await xo.call('role.getAll')

      // FIXME: use permutationOf but figure out how not to compare objects by
      // equality.
      expect(role).toEqual([
        {
          id: 'viewer',
          name: 'Viewer',
          permissions: ['view'],
        },
        {
          id: 'operator',
          name: 'Operator',
          permissions: ['view', 'operate'],
        },
        {
          id: 'admin',
          name: 'Admin',
          permissions: ['view', 'operate', 'administrate'],
        },
      ])
    })
  })
})
