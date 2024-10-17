/* eslint-env jest */

// eslint-disable-next-line n/no-missing-import
import { config, getOrWaitCdVbdPosition, rejectionOf, waitObjectState, xo } from './../util'

// ===================================================================

beforeAll(async () => {
  jest.setTimeout(20e3)
})

describe('cd', () => {
  let vmId

  // ----------------------------------------------------------------------

  beforeAll(async () => {
    vmId = await xo.call('vm.create', {
      name_label: 'vmTest',
      template: config.templatesId.debian,
    })
    await waitObjectState(xo, vmId, vm => {
      if (vm.type !== 'VM') throw new Error('retry')
    })
  })

  afterAll(() => xo.call('vm.delete', { id: vmId }))

  // ===================================================================

  describe('.insertCd()', () => {
    afterEach(() => xo.call('vm.ejectCd', { id: vmId }))

    it('mount an ISO on the VM (force: false)', async () => {
      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: config.windowsIsoId,
        force: false,
      })
      const vbdId = await getOrWaitCdVbdPosition(vmId)

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.VDI).toBe(config.windowsIsoId)
        expect(vbd.is_cd_drive).toBeTruthy()
        expect(vbd.position).toBe('3')
      })
    })

    it('mount an ISO on the VM (force: false) which has already a CD in the VBD', async () => {
      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: config.windowsIsoId,
        force: false,
      })
      await getOrWaitCdVbdPosition(vmId)

      expect(
        (
          await rejectionOf(
            xo.call('vm.insertCd', {
              id: vmId,
              cd_id: config.ubuntuIsoId,
              force: false,
            })
          )
        ).message
      ).toBe('unknown error from the peer')
    })

    it('mount an ISO on the VM (force: true) which has already a CD in the VBD', async () => {
      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: config.windowsIsoId,
        force: true,
      })
      const vbdId = await getOrWaitCdVbdPosition(vmId)

      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: config.ubuntuIsoId,
        force: true,
      })

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.VDI).toBe(config.ubuntuIsoId)
        expect(vbd.is_cd_drive).toBeTruthy()
        expect(vbd.position).toBe('3')
      })
    })

    it("mount an ISO on a VM which do not have already cd's VBD", async () => {
      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: config.windowsIsoId,
        force: false,
      })

      await waitObjectState(xo, vmId, async vm => {
        expect(vm.$VBDs).toHaveLength(1)
        const vbd = await xo.getOrWaitObject(vm.$VBDs)
        expect(vbd.is_cd_drive).toBeTruthy()
        expect(vbd.position).toBe('3')
      })
    })
  })

  describe('.ejectCd()', () => {
    it('ejects an ISO', async () => {
      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: config.windowsIsoId,
        force: false,
      })

      const vbdId = await getOrWaitCdVbdPosition(vmId)

      await xo.call('vm.ejectCd', { id: vmId })
      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.VDI).toBeNull()
      })
    })
  })
})
