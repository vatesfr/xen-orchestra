import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'

import { rewrite } from './engine'
import { LEGACY_COOKIE, planRewrite, sameMatch, sameRule, toEntryFields } from './rules'
import { liveVifs } from './store'

const log = createLogger('xo:sdn-controller:traffic-rules:migration')

// =============================================================================
// The only place that reads the legacy key, `xo:sdn-controller:of-rules`.
//
// Before a network is migrated, the key holds its rules: the network's own, and
// each VIF's. Afterwards the network's key is gone, and each VIF's is a copy
// written by store.save for XO 5 and for an older XO. The copies must never come
// back into the list: they are only read here, to delete flows an older XO may
// have installed from them.
// =============================================================================

export function parseLegacy(raw) {
  return raw === undefined ? [] : JSON.parse(raw).map(JSON.parse)
}

export function hasLegacyRules(network) {
  return (
    network.other_config[SDN_CONTROLLER_OF_RULES_KEY] !== undefined ||
    liveVifs(network).some(vif => vif.other_config[SDN_CONTROLLER_OF_RULES_KEY] !== undefined)
  )
}

function compareVifs(a, b) {
  return (
    (a.$VM.name_label ?? '').localeCompare(b.$VM.name_label ?? '') ||
    Number(a.device) - Number(b.device) ||
    (a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0)
  )
}

// The legacy rules of a network, in the order XO 6 shows them today
// (traffic-rules.composable.ts): the network's rules, then the VIF rules by VM
// name, then by VIF device. The VIF uuid settles the remaining ties, so the order
// does not depend on the order XAPI lists the VIFs in.
//
// All legacy flows share one priority, and OVS keeps the last rule added for a
// match: of two rules with the same match on the same target, the last one is
// the one in effect, and the only one kept.
export function legacyEntries(network) {
  const vifs = liveVifs(network)
    .filter(vif => vif.other_config[SDN_CONTROLLER_OF_RULES_KEY] !== undefined)
    .sort(compareVifs)
  const rules = [
    ...parseLegacy(network.other_config[SDN_CONTROLLER_OF_RULES_KEY]),
    ...vifs.flatMap(vif =>
      parseLegacy(vif.other_config[SDN_CONTROLLER_OF_RULES_KEY]).map(rule => ({ ...rule, mac: vif.MAC }))
    ),
  ]
  return rules
    .filter((rule, index) => !rules.slice(index + 1).some(other => sameMatch(other, rule)))
    .map(rule => ({
      ...toEntryFields(rule),
      // A network rule created since 2026-02 has a cookie, but on a plugin older
      // than cookies its flows got cookie 0 anyway: LEGACY_COOKIE covers both.
      previousCookies: rule.cookie === undefined ? [LEGACY_COOKIE] : [rule.cookie, LEGACY_COOKIE],
    }))
}

// Moves a network's legacy rules into the ordered list, in the band above the
// legacy priority. The new flows take over as soon as they are installed, and the
// legacy ones are deleted afterwards: by cookie when they have one, by fields for
// the cookie-0 ones (engine.rewrite). Then the network's legacy key goes, and the
// VIFs' keys are already copies (store.save).
//
// A network without any rule is "migrated" too: its list starts empty.
export async function migrate({ network, plugin, store }) {
  const { entries, deleteOrder } = planRewrite(legacyEntries(network))
  network = await rewrite({ network, entries, deleteOrder, plugin, store })
  if (network.other_config[SDN_CONTROLLER_OF_RULES_KEY] !== undefined) {
    await network.update_other_config(SDN_CONTROLLER_OF_RULES_KEY, null)
    network = await network.$xapi.barrier(network.$ref)
  }
  log.info('traffic rules moved to the ordered list', { network: network.uuid, rules: entries.length })
  return network
}

// Legacy data on a network that uses the ordered list comes from an interrupted
// migration, or from an older XO (a downgrade, another instance): the network's
// legacy key, or a VIF copy that differs from what store.save wrote. Its rules
// are not imported. Their flows are deleted, so they cannot apply to traffic the
// list does not match, and the caller saves the list again, which rewrites the
// copies.
//
// A delete by fields only reaches cookie-0 flows, which the ordered list never
// installs.
export async function neutralizeLegacy({ network, entries, plugin }) {
  const raw = network.other_config[SDN_CONTROLLER_OF_RULES_KEY]
  if (raw !== undefined) {
    const rules = parseLegacy(raw)
    log.warn(
      'legacy traffic rules found on a network using the ordered list: their flows are deleted, they are not imported',
      {
        network: network.uuid,
        rules: rules.length,
      }
    )
    for (const rule of rules) {
      const fields = toEntryFields(rule)
      if (rule.cookie !== undefined) {
        await plugin.deleteCookie(network, fields, rule.cookie)
      }
      await plugin.deleteLegacy(network, fields)
    }
    await network.update_other_config(SDN_CONTROLLER_OF_RULES_KEY, null)
    network = await network.$xapi.barrier(network.$ref)
  }
  for (const vif of liveVifs(network)) {
    await neutralizeVifCopy({ network, vif, entries, plugin })
  }
  return network
}

// The VIF part of neutralizeLegacy, also run when a VIF is attached: a clone, a
// revert or a VM created from a template brings the copy of another VIF.
export async function neutralizeVifCopy({ network, vif, entries, plugin }) {
  const raw = vif.other_config[SDN_CONTROLLER_OF_RULES_KEY]
  if (raw === undefined) {
    return
  }
  const rules = parseLegacy(raw)
  for (const rule of rules) {
    const fields = toEntryFields({ ...rule, mac: vif.MAC })
    if (!entries.some(entry => sameRule(entry, fields))) {
      log.debug('deleting legacy traffic rule flows from VIF copy', { network: network.uuid, vif: vif.uuid })
      await plugin.deleteLegacy(network, fields)
    }
  }
}
