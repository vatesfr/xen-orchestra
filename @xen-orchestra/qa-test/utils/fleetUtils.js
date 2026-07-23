import { createLogger } from '@xen-orchestra/log'
import assert from 'node:assert'
import { asyncEach } from '@vates/async-each'

const log = createLogger('xo:qa-test:fleet')

// Bounded by concurrency instead of one Promise.all over the whole fleet.
export async function cloneFleet({
  dispatchClient,
  referenceVm,
  count,
  namePrefix,
  tracker,
  concurrency = 4,
  bootTimeout = 120_000,
  ipTimeout = 300_000,
}) {
  assert(Number.isInteger(count) && count > 0, 'cloneFleet requires a positive integer count')

  const fleet = []

  await asyncEach(
    Array.from({ length: count }, (_, index) => index),
    async index => {
      const name = `${namePrefix}-${index}`

      const id = await dispatchClient.vm.clone(referenceVm.uuid, name, {
        description: 'Load-test VM (churn fleet)',
        fastClone: true,
      })
      tracker?.trackResource('vm', id, { name, source: referenceVm.name_label })

      await dispatchClient.vm.start(id)
      await dispatchClient.vm.waitForPowerState(id, 'Running', bootTimeout)
      const ip = await dispatchClient.vm.waitForGuestIp(id, ipTimeout)

      log.debug('Fleet VM ready', { name, id, ip })
      fleet.push({ id, ip })
    },
    { concurrency }
  )

  return fleet
}
