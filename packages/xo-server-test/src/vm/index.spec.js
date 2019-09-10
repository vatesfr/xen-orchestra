/* eslint-env jest */

import { mapValues } from 'lodash'

import config from '../_config'
import xo from '../_xoConnection'

describe('vm', () => {
  describe('.set() :', () => {
    const PROPERTIES_TO_SET_TO_NULL = {
      coresPerSocket: 1,
      cpuCap: 1,
    }
    it('set properties to null', async () => {
      const id = await xo.createTempVm({
        name_label: 'XO Test',
        template: config.templates.default,
        ...PROPERTIES_TO_SET_TO_NULL,
      })
      expect(xo.objects.all[id]).toMatchObject(PROPERTIES_TO_SET_TO_NULL)

      await xo.call('vm.set', {
        id,
        ...mapValues(PROPERTIES_TO_SET_TO_NULL, _ => null),
      })
      await xo.waitObjectState(id, vm => {
        Object.keys(PROPERTIES_TO_SET_TO_NULL).forEach(prop => {
          expect(vm[prop]).toBe(undefined)
        })
      })
    }, 6e3)
  })
})
