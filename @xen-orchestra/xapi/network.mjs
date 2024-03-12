import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:xapi:network')

export default class Network {
  async setMtu(network, mtu) {
    await network.set_MTU(mtu)

    // The MTU will not be updated for VIFs of paused VM, but we can't unplug/replug VIF on a paused VM
    const pluggedVifsRefs = network.$VIFs
      .filter(vif => vif.currently_attached && vif.$VM.power_state === 'Running')
      .map(vif => vif.$ref)
    const pluggedPifsRefs = network.$PIFs.filter(pif => pif.currently_attached).map(pif => pif.$ref)

    let errorOccurred = false

    for (const { method, networkInterfaces } of [
      {
        method: 'VIF.unplug',
        networkInterfaces: pluggedVifsRefs,
      },
      {
        method: 'PIF.unplug',
        networkInterfaces: pluggedPifsRefs,
      }, // unplugging PIFs may be unnecessary
      {
        method: 'PIF.plug',
        networkInterfaces: pluggedPifsRefs,
      },
      {
        method: 'VIF.plug',
        networkInterfaces: pluggedVifsRefs,
      },
    ]) {
      try {
        await asyncEach(networkInterfaces, networkInterface => this.callAsync(method, networkInterface), {
          stopOnError: false,
        })
      } catch (error) {
        // report an error occured, but continue the re-plugging process
        errorOccurred = true
        warn(error)
      }
    }

    if (errorOccurred) {
      throw new Error('Some network interfaces could not be updated.')
    }
  }
}
