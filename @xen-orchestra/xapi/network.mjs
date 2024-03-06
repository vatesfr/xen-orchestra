export default class Network {
  async setMtu(network, mtu) {
    await network.set_MTU(mtu)

    // The MTU will not be updated for VIFs of paused VM, but we can't unplug/replug VIF on a paused VM
    const pluggedVIFs = network.$VIFs.filter(vif => vif.currently_attached && vif.$VM.power_state === 'Running')
    const pluggedPIFs = network.$PIFs.filter(pif => pif.currently_attached)

    await Promise.allSettled(pluggedVIFs.map(vif => this.callAsync('VIF.unplug', vif.$ref)))
    await Promise.allSettled(pluggedPIFs.map(pif => this.callAsync('PIF.plug', pif.$ref)))
    await Promise.allSettled(pluggedPIFs.map(pif => this.callAsync('PIF.plug', pif.$ref)))
    await Promise.allSettled(pluggedVIFs.map(vif => this.callAsync('VIF.plug', vif.$ref)))
  }
}
