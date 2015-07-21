/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getMainConnection} from './util'

// ===================================================================

describe('role', function () {
  let xo
  before(async function () {
    xo = await getMainConnection()
  })

// ==================================================================
  describe('.getAll()', function () {

    it(' returns all the roles', async function () {

      const role = await xo.call('role.getAll')

      // FIXME: use permutationOf but figure out how not to compare objects by
      // equality.
      expect(role).to.eql([
        {
          id: 'viewer',
          name: 'Viewer',
          permissions: ['view']
        },
        {
          id: 'operator',
          name: 'Operator',
          permissions: ['view', 'operate']
        },
        {
          id: 'admin',
          name: 'Admin',
          permissions: ['view', 'operate', 'administrate']
        }
      ])
    })
  })
})
