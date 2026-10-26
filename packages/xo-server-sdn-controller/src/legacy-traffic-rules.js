// @ts-check

import { invalidParameters } from 'xo-common/api-errors.js'

/**
 * @import { Network, Owner, RuleParams, Vif } from './traffic-rules.js'
 */

// The legacy methods of SDNController (index.js) which this class calls. They take the XO id of
// the network or of the VIF, its UUID.
/**
 * @typedef {Omit<RuleParams, 'allow' | 'priority'>} MatchParams
 *
 * @typedef {object} LegacyController
 * @property {(params: RuleParams & { vifId: string }) => Promise<void>} _addRule
 * @property {(params: RuleParams & { networkId: string }) => Promise<void>} _addNetworkRule
 * @property {(params: MatchParams & { vifId: string }) => Promise<void>} _deleteRule
 * @property {(params: MatchParams & { networkId: string }) => Promise<void>} _deleteNetworkOfRule
 * @property {(vif: Vif) => Promise<void>} _applyVifOfRules
 * @property {(vif: Vif) => Promise<void>} _cleanVifOfRules
 * @property {(network: Network) => Promise<void>} _applyNetworkOfRules
 * @property {(network: Network) => Promise<void>} _cleanNetworkOfRules
 */

// =============================================================================
// The direct OpenFlow channel keeps the legacy traffic rule methods of
// SDNController, behind the interface of TrafficRules: rules have no priority,
// and their flows go when a VIF is about to go down, to be installed again once
// it is back.
// =============================================================================

export class LegacyTrafficRules {
  /** @type {LegacyController} */
  #controller

  /**
   * @param {LegacyController} controller
   */
  constructor(controller) {
    this.#controller = controller
  }

  // the legacy methods would drop it
  /**
   * @param {number | null | undefined} priority
   */
  checkPriority(priority) {
    if (priority != null) {
      throw invalidParameters('a traffic rule priority needs the XAPI plugin mode')
    }
  }

  // Returns no rank, as rules have none
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} params
   */
  async addRule(target, params) {
    if (target.$type === 'VIF') {
      await this.#controller._addRule({ ...params, vifId: target.uuid })
    } else {
      await this.#controller._addNetworkRule({ ...params, networkId: target.uuid })
    }
  }

  /**
   * @param {Owner} target the network or the VIF
   * @param {MatchParams} params
   */
  async deleteRule(target, params) {
    if (target.$type === 'VIF') {
      await this.#controller._deleteRule({ ...params, vifId: target.uuid })
    } else {
      await this.#controller._deleteNetworkOfRule({ ...params, networkId: target.uuid })
    }
  }

  // The priority of `newParams`, `null` at most, means nothing here. Returns no rank.
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} oldParams
   * @param {RuleParams} newParams
   */
  async updateRule(target, oldParams, newParams) {
    await this.deleteRule(target, oldParams)
    await this.addRule(target, newParams)
  }

  // At every connection to a pool. Network rules are installed again as their VIFs are plugged.
  /**
   * @param {Network} network
   */
  async refresh(network) {
    for (const vif of network.$VIFs) {
      await this.#controller._applyVifOfRules(vif)
    }
  }

  /**
   * @param {Vif} vif
   */
  async vifAttached(vif) {
    await this.#controller._applyVifOfRules(vif)
    await this.#controller._applyNetworkOfRules(vif.$network)
  }

  // the network rules are refreshed by cleaning and applying them
  /**
   * @param {Vif} vif
   */
  async vifDetaching(vif) {
    await this.#controller._cleanNetworkOfRules(vif.$network)
    await this.#controller._applyNetworkOfRules(vif.$network)
    await this.#controller._cleanVifOfRules(vif)
  }

  // everything went in vifDetaching
  /**
   * @param {Vif} vif
   */
  async vifDetached(vif) {}
}
