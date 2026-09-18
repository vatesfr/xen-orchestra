import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'

export function createHostOperations(xenApi: XenApi) {
  type HostRef = XenApiHost['$ref']

  const disable = (hostRef: HostRef) => xenApi.call('host.disable', [hostRef])

  const enable = (hostRef: HostRef) => xenApi.call('host.enable', [hostRef])

  const evacuate = (hostRef: HostRef) => xenApi.call('host.evacuate', [hostRef])

  const reboot = (hostRef: HostRef) => xenApi.call('host.reboot', [hostRef])

  const powerOn = (hostRef: HostRef) => xenApi.call('host.power_on', [hostRef])

  const shutdown = (hostRef: HostRef) => xenApi.call('host.shutdown', [hostRef])

  const destroy = (hostRef: HostRef) => xenApi.call('host.destroy', [hostRef])

  const clearHost = async (hostRef: HostRef, force: boolean) => {
    await disable(hostRef)

    try {
      await evacuate(hostRef)
    } catch (error) {
      if (!force) {
        await enable(hostRef)

        throw error
      }
      console.error(`Host evacuation failed, forcing reboot of ${hostRef}:`, error)
    }
  }

  return {
    disable,
    enable,
    powerOn,
    shutdown,
    destroy,
    cleanReboot: async (hostRef: HostRef, forceReboot: boolean) => {
      await clearHost(hostRef, forceReboot)

      await reboot(hostRef)
    },
    cleanShutdown: async (hostRef: HostRef) => {
      await clearHost(hostRef, false)

      await shutdown(hostRef)
    },
  }
}
