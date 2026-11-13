import { createLogger } from '@xen-orchestra/log'
import { forbiddenOperation, placementRefused } from 'xo-common/api-errors.js'

const log = createLogger('xo:placement-guards')

// The API parameter that overrides a guard's refusal. Its only guard today is
// the firewall's (xo-server-vdf), hence its name.
export const BYPASS_PARAMETER = 'bypassFirewallCheck'

// The power states from which each operation puts the VM onto a host: a VM
// already running (or paused) only moves by a migration, a halted or
// suspended one is not on any host until started or resumed.
const PLACING_STATES = {
  start: ['Halted', 'Suspended'],
  resume: ['Suspended'],
  migrate: ['Running', 'Paused'],
}

const ref = object => (object === undefined ? undefined : { id: object.id, name: object.name_label })

/**
 * Placement guards: a plugin may refuse that XO starts, resumes or migrates a
 * VM onto a host (vdf#141: the firewall refuses a host whose agent can't
 * enforce it). Core knows nothing of their rules; it asks every registered
 * guard before the operation, refuses with `placementRefused` for the first
 * one that refuses, and handles the override (`bypassFirewallCheck`): who may
 * use it is the guard's decision, using it is logged. Without a guard (no
 * plugin loaded), nothing changes. A guard that throws (`check` or
 * `mayBypass`) refuses nothing: the failure is logged as a warning and the
 * operation goes on.
 *
 * What XO does not start or migrate itself through these paths (xe, another
 * client, HA, an evacuation) is not guarded: the guards' plugin has to detect
 * it.
 */
export default class PlacementGuards {
  #guards = new Set()

  constructor(app) {
    this._app = app
  }

  /**
   * @param {object} guard
   * @param {string} guard.name - for the logs and the error (`firewall`)
   * @param {string} guard.bypassRight - who may override its refusals, in words ("XO administrators and…")
   * @param {(context: { operation: 'start' | 'resume' | 'migrate', vm: object, host: object | undefined, pool: object, vifNetworks: Record<string, string> | undefined }) => Promise<{ host?: object, reason: string } | undefined>} guard.check
   *   why the VM may not be placed, if it may not; `host`: undefined when XAPI
   *   picks one (the VM's pool's hosts it could land on are the guard's to
   *   find); `vifNetworks`: VIF id → network id of a migration's mapping, if any
   * @param {(context: { user: object, pool: object }) => Promise<boolean>} guard.mayBypass
   * @returns {() => void} removes the guard
   */
  registerPlacementGuard(guard) {
    const entry = { ...guard }
    this.#guards.add(entry)
    return () => {
      this.#guards.delete(entry)
    }
  }

  /**
   * Asks the guards before an operation that puts the VM onto a host.
   *
   * @param {object} params
   * @param {'start' | 'resume' | 'migrate'} params.operation
   * @param {object | undefined} params.user - the XO user; none: xo-server's own work, which may bypass
   * @param {object} params.vm - the XO record of the VM
   * @param {object} [params.host] - the XO record of the host; none: XAPI picks one in the VM's pool
   * @param {boolean} [params.bypass] - the override (`bypassFirewallCheck`)
   * @param {Record<string, string>} [params.vifNetworks] - a migration's VIF id → network id
   * @throws {Error} `placementRefused` if a guard refuses and `bypass` is not set,
   *   `forbiddenOperation` if it is set by a user the refusing guard does not allow to
   */
  async checkPlacement({ operation, user, vm, host, bypass = false, vifNetworks }) {
    if (this.#guards.size === 0 || !PLACING_STATES[operation].includes(vm.power_state)) {
      return
    }
    // vm.start resumes a suspended VM, wherever XAPI picks (Xapi#startVm)
    if (operation === 'start' && vm.power_state === 'Suspended') {
      host = undefined
    }
    let pool
    try {
      pool = this._app.getObject(host?.$pool ?? vm.$pool, 'pool')
    } catch (error) {
      log.warn(`no placement guard asked: the pool is unknown, ${operation} goes on`, {
        vm: vm.id,
        host: host?.id,
        error,
      })
      return
    }

    // A guard that fails (a plugin bug, a XAPI call failing, a pool
    // unreachable) refuses nothing: logged, the operation goes on. A guard
    // is there to stop a placement it knows to be wrong, never to stop
    // people from starting VMs because it is broken.
    const ask = async (guard, what, fn) => {
      try {
        return { answer: await fn() }
      } catch (error) {
        log.warn(`the ${guard.name} placement guard failed (${what}): ${operation} goes on`, {
          guard: guard.name,
          vm: vm.id,
          vmName: vm.name_label,
          host: host?.id,
          hostName: host?.name_label,
          error,
        })
      }
    }

    for (const guard of [...this.#guards]) {
      const checked = await ask(guard, 'check', async () => {
        const refusal = await guard.check({ operation, vm, host, pool, vifNetworks })
        if (refusal !== undefined && typeof refusal?.reason !== 'string') {
          throw new TypeError(`a refusal without reason: ${JSON.stringify(refusal)}`)
        }
        return refusal
      })
      const refusal = checked?.answer
      if (refusal === undefined) {
        continue
      }
      const refusedHost = refusal.host ?? host
      let allowed = true
      if (user !== undefined) {
        const decided = await ask(guard, 'mayBypass', () => guard.mayBypass({ user, pool }))
        if (decided === undefined) {
          continue
        }
        allowed = decided.answer === true
      }
      if (!bypass) {
        placementRefused({
          operation,
          vm: ref(vm),
          host: ref(refusedHost),
          guard: guard.name,
          reason: refusal.reason,
          bypass: { parameter: BYPASS_PARAMETER, allowed, who: guard.bypassRight },
        })
      }
      if (!allowed) {
        throw forbiddenOperation(
          `${operation} VM with ${BYPASS_PARAMETER}`,
          `${refusal.reason}: only ${guard.bypassRight} may override the ${guard.name} check`
        )
      }
      log.warn(`${operation} of a VM the ${guard.name} guard refused, with ${BYPASS_PARAMETER}`, {
        user: user?.id,
        userName: user?.email ?? user?.name,
        vm: vm.id,
        vmName: vm.name_label,
        host: refusedHost?.id,
        hostName: refusedHost?.name_label,
        reason: refusal.reason,
      })
    }
  }
}
