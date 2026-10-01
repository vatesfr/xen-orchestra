import { SDN_CONTROLLER_OF_RULES_KEY, SDN_CONTROLLER_TRAFFIC_RULES_KEY } from '@vates/types'

import { parseList, serializeCopy } from './rules'

// The key stays once written, as `[]` when the last rule goes: it is what keeps
// a network out of the legacy code, and its migration from running again and
// reading the VIF copies back as rules.
export function isManaged(network) {
  return network.other_config[SDN_CONTROLLER_TRAFFIC_RULES_KEY] !== undefined
}

export function readList(network) {
  return parseList(network.other_config[SDN_CONTROLLER_TRAFFIC_RULES_KEY])
}

// The VIFs whose rules belong to the network's list: snapshots and templates
// only keep a frozen copy of their VM's VIF.
export function liveVifs(network) {
  return network.$VIFs.filter(vif => {
    const vm = vif.$VM
    return vm !== undefined && !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain
  })
}

// Writes the list, highest priority first, and the copy each live VIF keeps in
// the legacy key. This is the only place the copies are written, and they are
// never parsed outside migration.js: their raw value is only compared, to skip
// identical writes.
//
// Resolves to the network's current record: XAPI records are replaced on update.
export async function save(network, entries) {
  entries.sort((a, b) => b.priority - a.priority)
  await network.update_other_config(SDN_CONTROLLER_TRAFFIC_RULES_KEY, JSON.stringify(entries))
  for (const vif of liveVifs(network)) {
    const copy = serializeCopy(entries, vif.MAC.toLowerCase())
    if ((vif.other_config[SDN_CONTROLLER_OF_RULES_KEY] ?? null) !== copy) {
      await vif.update_other_config(SDN_CONTROLLER_OF_RULES_KEY, copy)
    }
  }
  return network.$xapi.barrier(network.$ref)
}
