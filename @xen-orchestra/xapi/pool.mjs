import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@vates/task'

import { getCurrentVmUuid } from './_XenStore.mjs'

const CACHE = new Map()

const noop = Function.prototype

async function pCatch(p, code, cb) {
  try {
    return await p
  } catch (error) {
    if (error.code === code) {
      return cb(error)
    }
    throw error
  }
}

const { warn } = createLogger('xo:xapi:pool')

export default class Pool {
  async emergencyShutdown() {
    const poolMasterRef = this.pool.master

    let currentVmRef
    try {
      currentVmRef = await this.call('VM.get_by_uuid', await getCurrentVmUuid())

      // try to move current VM on pool master
      const hostRef = await this.call('VM.get_resident_on', currentVmRef)
      if (hostRef !== poolMasterRef) {
        await Task.run(
          {
            properties: {
              name: 'Migrating current VM to pool master',
              currentVm: { $ref: currentVmRef },
              poolMaster: { $ref: poolMasterRef },
            },
          },
          async () => {
            await this.callAsync('VM.pool_migrate', currentVmRef, poolMasterRef, {})
          }
        ).catch(noop)
      }
    } catch (error) {
      warn(error)
    }

    await pCatch(this.call('pool.disable_ha'), 'HA_NOT_ENABLED', noop)

    const hostRefs = await this.call('host.get_all')

    // disable all hosts and suspend all VMs
    await asyncEach(hostRefs, async hostRef => {
      await this.call('host.disable', hostRef).catch(warn)

      const [controlDomainRef, vmRefs] = await Promise.all([
        this.call('host.get_control_domain', hostRef),
        this.call('host.get_resident_VMs', hostRef),
      ])

      await asyncEach(vmRefs, vmRef => {
        // never stop current VM otherwise the emergencyShutdown process would be interrupted
        if (vmRef !== currentVmRef && vmRef !== controlDomainRef) {
          return Task.run(
            {
              properties: {
                name: 'suspending VM',
                host: { $ref: hostRef },
                vm: { $ref: vmRef },
              },
            },
            async () => {
              await pCatch(this.callAsync('VM.suspend', vmRef), 'VM_BAD_POWER_STATE', noop)
            }
          ).catch(noop)
        }
      })
    })

    const shutdownHost = ref =>
      Task.run(
        {
          properties: {
            name: 'shutting down host',
            host: { $ref: ref },
          },
        },
        async () => {
          await this.callAsync('host.shutdown', ref)
        }
      ).catch(noop)

    // shutdown all non-pool master hosts
    await asyncEach(hostRefs, hostRef => {
      // pool master will be shutdown at the end
      if (hostRef !== poolMasterRef) {
        return shutdownHost(hostRef)
      }
    })

    // shutdown pool master
    await shutdownHost(poolMasterRef)
  }

  async getGuestSecureBootReadiness(ref, { _forceRefresh }) {
    const cache = CACHE.get(ref)
    if (!_forceRefresh && cache !== undefined && cache.expiresOn > Date.now()) {
      return cache.value
    }

    const secureBootReadiness = await this.call('pool.get_guest_secureboot_readiness', ref)
    CACHE.set(ref, {
      value: secureBootReadiness,
      expiresOn: Date.now() + 3e4,
    })

    return secureBootReadiness
  }
}
