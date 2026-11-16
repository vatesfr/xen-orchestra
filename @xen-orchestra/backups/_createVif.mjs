import pick from 'lodash/pick.js'
import { invalidParameters } from 'xo-common/api-errors.js'
import { isVlanNetwork } from '@xen-orchestra/xapi'
import { Task } from '@vates/task'

// Creates a VIF of a restored or replicated VM. A VIF whose VLAN filtering can't be honoured is created without it
// (the VM is restored anyway) and the task log says so
export async function createVif({ xapi, vif, network, vmRef, newMacAddresses }) {
  let { trunks } = vif
  if (trunks !== undefined && trunks.length !== 0 && isVlanNetwork(network)) {
    Task.warning('VLAN filtering dropped: the target network has a VLAN', {
      network: pick(network, 'uuid', 'name_label'),
      vif: pick(vif, 'device', 'trunks'),
    })
    trunks = undefined
  }

  const create = trunks =>
    xapi.VIF_create(
      {
        ...vif,
        network: network.$ref,
        trunks,
        VM: vmRef,
      },
      {
        MAC: newMacAddresses ? undefined : vif.MAC,
      }
    )

  // VIF_create refuses trunks on a pool without VLAN filtering (xapi < 26.1.16)
  try {
    return await create(trunks)
  } catch (error) {
    if (!invalidParameters.is(error, { errors: [{ field: 'trunks' }] })) {
      throw error
    }
    Task.warning('VLAN filtering dropped: the target pool has none', { vif: pick(vif, 'device', 'trunks') })
    return create(undefined)
  }
}
