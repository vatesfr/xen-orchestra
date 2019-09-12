/* eslint-env jest */

import config from '../_config'
import xo from '../_xoConnection'

describe('vm', () => {
  describe('.set() :', () => {
    it('set properties to null', async () => {
      await xo.createTempServer(config.servers.default)
      const vm = await xo.createTempVm({
        coresPerSocket: 1,
        cpuCap: 1,
        name_label: 'XO Test',
        template: config.templates.templateWithoutDisks,
      })

      expect(vm).toMatchObject({
        coresPerSocket: 1,
        cpuCap: 1,
      })

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
