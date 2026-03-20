import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'

import { setup, teardown } from './setup.js'

describe('VM basic tests', () => {
  let dispatchClient
  let tracker
  let vms
  let vmTemplate

  before(async () => {
    ;({ dispatchClient, tracker } = await setup())
    vms = await dispatchClient.vm.list()
  })
  describe('List VMS', () => {
    it('should list all vms', async () => {
      assert(vms.length > 0)
    })
    it('should have a VM with a name_label', async () => {
      const vmInfo = await dispatchClient.vm.details(vms[0].uuid)
      assert(vmInfo.name_label !== undefined)
    })
    it('should get a given VM', async () => {
      vmTemplate = await dispatchClient.vm.getVmTemplate('AlmaLinux 8')
      assert(vmTemplate.name_label === 'AlmaLinux 8')
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })
})
