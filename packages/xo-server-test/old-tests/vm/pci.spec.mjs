/* eslint-env jest */

// eslint-disable-next-line n/no-missing-import
import { config, waitObjectState, xo } from './../util'

// ===================================================================

beforeAll(async () => {
  jest.setTimeout(30e3)
})

describe('pci', () => {
  let vmId

  // ----------------------------------------------------------------------

  beforeAll(async () => {
    vmId = await xo.call('vm.create', {
      name_label: 'vmTest',
      template: config.templatesId.debianCloud,
      VIFs: [{ network: config.labPoolNetworkId }],
      VDIs: [
        {
          device: '0',
          size: 1,
          SR: config.labPoolSrId,
          type: 'user',
        },
      ],
    })
    await waitObjectState(xo, vmId, vm => {
      if (vm.type !== 'VM') throw new Error('retry')
    })
  })

  afterAll(() => xo.call('vm.delete', { id: vmId, delete_disks: true }))

  // =================================================================

  it('attaches the pci to the VM', async () => {
    await xo.call('vm.attachPci', {
      vm: vmId,
      pciId: config.pciId,
    })

    await waitObjectState(xo, vmId, vm => {
      expect(vm.other.pci).toBe(config.pciId)
    })
  })

  it('detaches the pci from the VM', async () => {
    await xo.call('vm.detachPci', { vm: vmId })

    await waitObjectState(xo, vmId, vm => {
      expect(vm.other.pci).toBeUndefined()
    })
  })
})
