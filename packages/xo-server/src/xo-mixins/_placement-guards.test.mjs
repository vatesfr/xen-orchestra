import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { configure } from '@xen-orchestra/log/configure'
import { forbiddenOperation, placementRefused } from 'xo-common/api-errors.js'

import PlacementGuards from './placement-guards.mjs'

// what xo-server logs, warnings and above
const logs = []
configure({ level: 'WARN', transport: log => logs.push(log) })

const POOL = { id: 'pool-1', type: 'pool', name_label: 'prod' }
const POOL_2 = { id: 'pool-2', type: 'pool', name_label: 'lab' }
const HOST = { id: 'host-1', type: 'host', $pool: 'pool-1', name_label: 'xcp1' }
const HOST_2 = { id: 'host-2', type: 'host', $pool: 'pool-1', name_label: 'xcp2' }
const HOST_IN_POOL_2 = { id: 'host-3', type: 'host', $pool: 'pool-2', name_label: 'xcp3' }
const vmIn = powerState => ({ id: 'vm-1', type: 'VM', $pool: 'pool-1', name_label: 'web', power_state: powerState })
const HALTED = vmIn('Halted')

const ADMIN = { id: 'admin', permission: 'admin' }
const OPERATOR = { id: 'operator', email: 'op@example.org', permission: 'none' }

function createGuards() {
  const objects = { [POOL.id]: POOL, [POOL_2.id]: POOL_2 }
  // XO throws no such object for an unknown id
  const app = {
    getObject(id) {
      if (objects[id] === undefined) {
        throw new Error(`no such object ${id}`)
      }
      return objects[id]
    },
  }
  return new PlacementGuards(app)
}

// a guard refusing every host but `allowed`, recording what it's asked;
// `mayBypass`: who may override it
function refusing({ allowed = [], mayBypass = user => user.permission === 'admin' } = {}) {
  const checks = []
  const bypassAsked = []
  return {
    checks,
    bypassAsked,
    guard: {
      name: 'firewall',
      bypassRight: 'users with the firewall publish privilege',
      async check(context) {
        checks.push(context)
        const host = context.host ?? HOST_2
        return allowed.includes(host.id)
          ? undefined
          : { host, reason: `no firewall agent on host "${host.name_label}"` }
      },
      async mayBypass(context) {
        bypassAsked.push(context)
        return mayBypass(context.user)
      },
    },
  }
}

describe('placement guards', () => {
  it('changes nothing without a guard', async () => {
    const guards = createGuards()
    await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST })
  })

  it('asks each guard with the VM, the host and its pool, and lets through what none refuses', async () => {
    const guards = createGuards()
    const { checks, guard } = refusing({ allowed: ['host-1'] })
    guards.registerPlacementGuard(guard)
    await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST })
    assert.deepEqual(checks, [{ operation: 'start', vm: HALTED, host: HOST, pool: POOL, vifNetworks: undefined }])
  })

  it('refuses with a typed error naming the VM, the host, the reason and the override', async () => {
    const guards = createGuards()
    guards.registerPlacementGuard(refusing().guard)
    await assert.rejects(
      guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST }),
      error => {
        assert(placementRefused.is(error))
        assert.deepEqual(error.data, {
          operation: 'start',
          vm: { id: 'vm-1', name: 'web' },
          host: { id: 'host-1', name: 'xcp1' },
          guard: 'firewall',
          reason: 'no firewall agent on host "xcp1"',
          bypass: {
            parameter: 'bypassFirewallCheck',
            allowed: false,
            who: 'users with the firewall publish privilege',
          },
        })
        assert.equal(
          error.message,
          'cannot start VM "web" on host "xcp1": no firewall agent on host "xcp1". Only users with the firewall publish privilege may start it anyway, with bypassFirewallCheck.'
        )
        return true
      }
    )
  })

  it('tells a user who may override it how', async () => {
    const guards = createGuards()
    guards.registerPlacementGuard(refusing().guard)
    await assert.rejects(
      guards.checkPlacement({ operation: 'migrate', user: ADMIN, vm: vmIn('Running'), host: HOST }),
      error =>
        placementRefused.is(error, { bypass: { allowed: true } }) &&
        error.message ===
          'cannot migrate VM "web" to host "xcp1": no firewall agent on host "xcp1". To migrate it anyway, set bypassFirewallCheck.'
    )
  })

  it('names the host the guard refuses when XAPI picks one', async () => {
    const guards = createGuards()
    const { checks, guard } = refusing()
    guards.registerPlacementGuard(guard)
    await assert.rejects(guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED }), error =>
      placementRefused.is(error, { host: { id: 'host-2' } })
    )
    assert.equal(checks[0].host, undefined)
    assert.equal(checks[0].pool, POOL)
  })

  it('asks about the destination pool of a migration, with its VIF mapping', async () => {
    const guards = createGuards()
    const { checks, bypassAsked, guard } = refusing()
    guards.registerPlacementGuard(guard)
    const vifNetworks = { 'vif-1': 'net-2' }
    await assert.rejects(
      guards.checkPlacement({
        operation: 'migrate',
        user: OPERATOR,
        vm: vmIn('Running'),
        host: HOST_IN_POOL_2,
        vifNetworks,
      }),
      error => placementRefused.is(error)
    )
    assert.equal(checks[0].pool, POOL_2)
    assert.equal(checks[0].vifNetworks, vifNetworks)
    assert.deepEqual(bypassAsked, [{ user: OPERATOR, pool: POOL_2 }])
  })

  it('lets a user the guard allows override it, and logs it as a warning', async () => {
    const guards = createGuards()
    guards.registerPlacementGuard(refusing({ mayBypass: user => user.id === 'operator' }).guard)
    logs.length = 0
    await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST, bypass: true })
    assert.equal(logs.length, 1)
    assert.equal(logs[0].level, 40)
    assert.equal(logs[0].namespace, 'xo:placement-guards')
    assert.deepEqual(logs[0].data, {
      user: 'operator',
      userName: 'op@example.org',
      vm: 'vm-1',
      vmName: 'web',
      host: 'host-1',
      hostName: 'xcp1',
      reason: 'no firewall agent on host "xcp1"',
    })
  })

  it('refuses the override to a user the guard does not allow, with a permission error', async () => {
    const guards = createGuards()
    guards.registerPlacementGuard(refusing().guard)
    logs.length = 0
    await assert.rejects(
      guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST, bypass: true }),
      error =>
        forbiddenOperation.is(error) &&
        error.data.reason ===
          'no firewall agent on host "xcp1": only users with the firewall publish privilege may override the firewall check'
    )
    assert.deepEqual(logs, [])
  })

  it("doesn't ask the guards about a VM the operation doesn't put onto a host", async () => {
    const guards = createGuards()
    const { checks, guard } = refusing()
    guards.registerPlacementGuard(guard)
    // vm.start unpauses a paused VM; a running one fails in XAPI
    await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: vmIn('Paused'), host: HOST })
    await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: vmIn('Running'), host: HOST })
    await guards.checkPlacement({ operation: 'resume', user: OPERATOR, vm: vmIn('Halted') })
    // a halted or suspended VM moves without running: guarded when started or resumed
    await guards.checkPlacement({ operation: 'migrate', user: OPERATOR, vm: vmIn('Halted'), host: HOST })
    await guards.checkPlacement({ operation: 'migrate', user: OPERATOR, vm: vmIn('Suspended'), host: HOST })
    assert.deepEqual(checks, [])
  })

  it('guards vm.start of a suspended VM wherever XAPI resumes it', async () => {
    const guards = createGuards()
    const { checks, guard } = refusing()
    guards.registerPlacementGuard(guard)
    await assert.rejects(
      guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: vmIn('Suspended'), host: HOST }),
      error => placementRefused.is(error, { host: { id: 'host-2' } })
    )
    assert.equal(checks[0].host, undefined)
  })

  it('stops asking a guard once it is removed', async () => {
    const guards = createGuards()
    const { checks, guard } = refusing()
    const unregister = guards.registerPlacementGuard(guard)
    unregister()
    await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST })
    assert.deepEqual(checks, [])
  })

  describe('a guard that fails refuses nothing', () => {
    const failing = (what, error = new Error('XAPI is down')) => ({
      ...refusing().guard,
      async check(context) {
        if (what === 'check') {
          throw error
        }
        if (what === 'refusal') {
          return { host: context.host }
        }
        return refusing().guard.check(context)
      },
      async mayBypass() {
        throw error
      },
    })

    it('logs a failing check as a warning, with the guard, the VM and the host, and lets the operation go on', async () => {
      const guards = createGuards()
      const error = new Error('XAPI is down')
      guards.registerPlacementGuard(failing('check', error))
      logs.length = 0
      await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST })
      assert.equal(logs.length, 1)
      assert.equal(logs[0].level, 40)
      assert.equal(logs[0].message, 'the firewall placement guard failed (check): start goes on')
      assert.deepEqual(logs[0].data, {
        guard: 'firewall',
        vm: 'vm-1',
        vmName: 'web',
        host: 'host-1',
        hostName: 'xcp1',
        error,
      })
    })

    it('lets the operation go on when deciding who may override it fails', async () => {
      const guards = createGuards()
      guards.registerPlacementGuard(failing('mayBypass'))
      logs.length = 0
      await guards.checkPlacement({ operation: 'migrate', user: OPERATOR, vm: vmIn('Running'), host: HOST })
      assert.equal(logs.length, 1)
      assert.equal(logs[0].message, 'the firewall placement guard failed (mayBypass): migrate goes on')
    })

    it('takes a refusal without a reason for a failure', async () => {
      const guards = createGuards()
      guards.registerPlacementGuard(failing('refusal'))
      logs.length = 0
      await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST })
      assert.equal(logs.length, 1)
      assert.match(logs[0].data.error.message, /a refusal without reason/)
    })

    it("doesn't hide another guard's refusal", async () => {
      const guards = createGuards()
      guards.registerPlacementGuard(failing('check'))
      guards.registerPlacementGuard(refusing().guard)
      await assert.rejects(
        guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: HALTED, host: HOST }),
        error => placementRefused.is(error)
      )
    })

    it('asks no guard about a VM whose pool XO does not know, and lets it go on', async () => {
      const guards = createGuards()
      const { checks, guard } = refusing()
      guards.registerPlacementGuard(guard)
      await guards.checkPlacement({ operation: 'start', user: OPERATOR, vm: { ...HALTED, $pool: 'pool-9' } })
      assert.deepEqual(checks, [])
    })
  })
})
