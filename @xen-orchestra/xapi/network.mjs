import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:xapi:network')

async function asyncFilter(arr, predicate) {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}

export default class Network {
  async setMtu(ref, mtu) {
    const network = await this.getRecord('network', ref)
    await network.set_MTU(mtu)

    // Update PIFs and VIFs MTU, see:
    // - https://github.com/xenserver/xenadmin/blob/b210cd2c2d8547f5bb48b49d71f17429c7d65e44/XenAdmin/SettingsPanels/EditNetworkPage.cs#L575
    // - https://github.com/xenserver/xenadmin/blob/b210cd2c2d8547f5bb48b49d71f17429c7d65e44/XenAdmin/SettingsPanels/EditNetworkPage.cs#L625-L628
    // - https://github.com/xenserver/xenadmin/blob/b210cd2c2d8547f5bb48b49d71f17429c7d65e44/XenModel/Actions/Network/UnplugPlugNetworkAction.cs#L81-L153

    // The MTU will not be updated for VIFs of paused VM, but we can't unplug/replug VIF on a paused VM
    const pluggedPifs = await asyncFilter(network.PIFs, async pif => {
      try {
        return await this.getField('PIF', pif, 'currently_attached')
      } catch (error) {
        warn(error)
        return false
      }
    })

    const pluggedVifs = await asyncFilter(network.VIFs, async vif => {
      try {
        const attached = await this.getField('VIF', vif, 'currently_attached')
        if (attached) {
          const VM = await this.getField('VIF', vif, 'VM')
          return (await this.getField('VM', VM, 'power_state')) === 'Running'
        }
        return false
      } catch (error) {
        warn(error)
        return false
      }
    })

    let errorOccurred = false

    for (const { method, networkInterfaces } of [
      {
        method: 'VIF.unplug',
        networkInterfaces: pluggedVifs,
      },
      {
        method: 'PIF.unplug',
        networkInterfaces: pluggedPifs,
      }, // unplugging PIFs may be unnecessary
      {
        method: 'PIF.plug',
        networkInterfaces: pluggedPifs,
      },
      {
        method: 'VIF.plug',
        networkInterfaces: pluggedVifs,
      },
    ]) {
      try {
        await asyncEach(networkInterfaces, networkInterface => this.callAsync(method, networkInterface), {
          stopOnError: false,
        })
      } catch (error) {
        // report an error occurred, but continue the re-plugging process
        errorOccurred = true
        warn(error)
      }
    }

    if (errorOccurred) {
      throw new Error('Some network interfaces could not be updated.')
    }
  }
}
