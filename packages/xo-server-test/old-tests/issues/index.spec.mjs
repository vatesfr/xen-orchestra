/* eslint-env jest */

import { parseDuration } from '@vates/parse-duration'

import config from '../../_config.mjs'
import xo from '../../_xoConnection.mjs'

describe('issue', () => {
  test('4507', async () => {
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

  test('4514', async () => {
    await xo.createTempServer(config.servers.default)

    const oldName = 'Old XO Test name'
    const { id, name_label } = await xo.createTempNetwork({ name: oldName })
    expect(name_label).toBe(oldName)

    const newName = 'New XO Test name'
    await xo.call('network.set', { id, name_label: newName })
    await xo.waitObjectState(id, ({ name_label }) => {
      expect(name_label).toBe(newName)
    })
  })

  test('4523', async () => {
    const id = await xo.call('network.create', {
      name: 'XO Test',
      pool: config.pools.default,
    })
    expect(typeof id).toBe('string')

    await xo.call('network.delete', { id })
  })

  describe('4980', () => {
    let template
    beforeAll(async () => {
      jest.setTimeout(parseDuration(config.cloneTempVmTimeout))
      template = await xo.cloneTempVm(config.templates.default)
    })

    const bootOrder = 'cd'
    const virtualizationMode = 'hvm'
    beforeAll(async () => {
      await Promise.all([
        xo.call('vm.set', {
          id: template.id,
          virtualizationMode,
        }),
        xo.call('vm.setBootOrder', { vm: template.id, order: bootOrder }),
      ])
      await xo.waitObjectState(template.id, {
        virtualizationMode,
        boot: {
          order: bootOrder,
        },
      })
    })

    test('create vm with disks should keep the template boot order', async () => {
      const vm = await xo.createTempVm({
        template: template.id,
        VDIs: [
          {
            size: 1,
            SR: config.srs.default,
            type: 'user',
          },
        ],
      })
      expect(vm.boot.order).toBe(bootOrder)
    })

    test('create vm without disks should make network boot the first option', async () => {
      const vm = await xo.createTempVm({
        template: template.id,
      })
      expect(vm.boot.order).toBe('n' + bootOrder)
    })

    test('create vm with disks and network installation should make network boot the first option', async () => {
      const vm = await xo.createTempVm({
        template: template.id,
        installation: {
          method: 'network',
          repository: 'pxe',
        },
        VDIs: [
          {
            size: 1,
            SR: config.srs.default,
            type: 'user',
          },
        ],
      })
      expect(vm.boot.order).toBe('n' + bootOrder)
    })
  })

  describe('5265', () => {
    const rsName = 'xo-server-test resource set'
    const subjects = ['one', 'two', 'three']
    test('resourceSet.removeSubject call', async () => {
      const id = await xo.createTempResourceSet({
        name: rsName,
        subjects,
      })

      await xo.call('resourceSet.removeSubject', {
        id,
        subject: subjects[0],
      })
    })
  })
})
