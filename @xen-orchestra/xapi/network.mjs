import { asyncEach } from '@vates/async-each'

export default class Network {
  async setMtu(network, mtu) {
    await network.set_MTU(mtu)

    // The MTU will not be updated for VIFs of paused VM, but we can't unplug/replug VIF on a paused VM
    const pluggedVIFs = network.$VIFs.filter(vif => vif.currently_attached && vif.$VM.power_state === 'Running')
    const pluggedPIFs = network.$PIFs.filter(pif => pif.currently_attached)

    let errorOccurred = false

    for (const { method, networkInterfaces } of [
      {
        method: 'VIF.unplug',
        networkInterfaces: pluggedVIFs,
      }, // unplugging PIFs before re-plugging seems unnecessary
      {
        method: 'PIF.plug',
        networkInterfaces: pluggedPIFs,
      },
      {
        method: 'VIF.plug',
        networkInterfaces: pluggedVIFs,
      },
    ]) {
      try {
        await asyncEach(networkInterfaces, networkInterface => this.callAsync(method, networkInterface.$ref), {
          concurrency: 20,
          stopOnError: false,
        })
      } catch (error) {
        // report an error occured, but continue the re-plugging process
        errorOccurred = true
      }
    }

    if (errorOccurred) {
      throw new Error('Some network interfaces could not be updated.')
    }
  }
}
