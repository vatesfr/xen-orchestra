/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {find} from 'lodash'
import {Xo} from 'xo-lib'

// ===================================================================

describe('vm', function () {
  let xo
  before(async function () {
    xo = new Xo('localhost:9000')

    await xo.signIn({
      email: 'admin@admin.net',
      password: 'admin'
    })
  })

  // =================================================================

  describe('.create()', function () {
    it('creates a PV VM with a diskless template')
  })
})
