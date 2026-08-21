import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'

export function createHostOperations(xenApi: XenApi) {
  type HostRef = XenApiHost['$ref']

  const disable = (hostRef: HostRef) => xenApi.call('host.disable', [hostRef])

  const enable = (hostRef: HostRef) => xenApi.call('host.enable', [hostRef])

  const evacuate = (hostRef: HostRef) => xenApi.call('host.evacuate', [hostRef])

  const reboot = (hostRef: HostRef) => xenApi.call('host.reboot', [hostRef])

  return {
    disable,

    enable,

    evacuate,

    reboot,

    cleanReboot: async (hostRef: HostRef) => {
      await disable(hostRef)

      try {
        await evacuate(hostRef)
      } catch (error) {
        await enable(hostRef)

        throw error
      }

      await reboot(hostRef)
    },
  }
}
