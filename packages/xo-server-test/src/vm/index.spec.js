/* eslint-env jest */

import config from '../_config'
import xo from '../_xoConnection'

describe('vm', () => {
  describe('.set() :', () => {
    it('set properties to null', async () => {
      await xo.createTempServer(config.servers.default)

      const props = {
        coresPerSocket: 1,
        cpuCap: 1,
      }
      const vm = await xo.createTempVm(props)
      expect(vm).toMatchObject(props)

      await xo.call('vm.set', {
        coresPerSocket: null,
        cpuCap: null,
        id: vm.id,
      })
      await xo.waitObjectState(vm.id, vm => {
        expect(vm.coresPerSocket).toBe(undefined)
        expect(vm.cpuCap).toBe(undefined)
      })
    })
  })
})
