import { asyncMapSettled } from '@xen-orchestra/async-map'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { forbiddenOperation } from 'xo-common/api-errors.js'

const DEFAULT_INTERFACE_NAME = 'default'

function linstorManagerCall(xapi, hostRef, fnName, args) {
  return xapi.call('host.call_plugin', hostRef, 'linstor-manager', fnName, args)
}

async function onEachAttachedHost(xapi, ref, cb) {
  const pbdRefs = await xapi.getField('SR', ref, 'PBDs')
  const pbdInfos = await Promise.all(
    pbdRefs.map(async ref => {
      const [hostRef, deviceConfig] = await Promise.all([
        xapi.getField('PBD', ref, 'host'),
        xapi.getField('PBD', ref, 'device_config'),
      ])
      return { hostRef, groupName: deviceConfig['group-name'] }
    })
  )

  return asyncMapSettled(pbdInfos, cb)
}

export default class Xostor {
  async getInterfaces(ref) {
    const interfaces = {}

    await onEachAttachedHost(this, ref, async ({ hostRef, groupName }) => {
      const hostname = await this.getField('host', hostRef, 'hostname')
      const hostInterfaces = JSON.parse(
        await linstorManagerCall(this, hostRef, 'listNodeInterfaces', {
          groupName,
          hostname,
        })
      )

      Object.entries(hostInterfaces).forEach(([interfaceName, iface]) => {
        if (interfaces[interfaceName] === undefined) {
          interfaces[interfaceName] = []
        }
        interfaces[interfaceName].push(iface)
      })
    })

    return interfaces
  }

  async createInterface($defer, ref, networkRef, interfaceName) {
    const pifRefs = await this.getField('network', networkRef, 'PIFs')
    const pifInfos = await Promise.all(
      pifRefs.map(async ref => {
        const [hostRef, pifUuid] = await Promise.all([
          this.getField('PIF', ref, 'host'),
          this.getField('PIF', ref, 'uuid'),
        ])
        return { hostRef, pifUuid }
      })
    )

    await onEachAttachedHost(this, ref, async ({ hostRef, groupName }) => {
      const hostname = await this.getField('host', hostRef, 'hostname')
      const pif = pifInfos.find(_pif => _pif.hostRef === hostRef)
      if (pif === undefined) {
        throw new Error(`No PIF found that links host: ${hostRef} to network: ${networkRef}`)
      }
      await linstorManagerCall(this, hostRef, 'createNodeInterface', {
        groupName,
        hostname,
        name: interfaceName,
        pifUuid: pif.pifUuid,
      })
      $defer.onFailure(() =>
        linstorManagerCall(this, hostRef, 'destroyNodeInterface', {
          groupName,
          hostname,
          name: interfaceName,
        })
      )
    })
  }

  async destroyInterface(ref, interfaceName) {
    if (interfaceName === DEFAULT_INTERFACE_NAME) {
      throw forbiddenOperation('this is a linstor default interface')
    }

    /**
     * FIXME: discussed with Ronan:
     * When implemented on the linstor-manager plugin, call `get_preferred_interface`
     * then switch the preferred interface to default if `interfaceName` equal the `preferred_interface`.
     */

    await onEachAttachedHost(this, ref, async ({ hostRef, groupName }) => {
      const hostname = await this.getField('host', hostRef, 'hostname')

      return linstorManagerCall(this, hostRef, 'destroyNodeInterface', {
        groupName,
        hostname,
        name: interfaceName,
      })
    })
  }

  async setPreferredInterface(ref, interfaceName) {
    /**
     * FIXME: When implemented on the linstor-manager plugin, call `get_preferred_interface`
     * to undo the change if an error is thrown
     */

    await onEachAttachedHost(this, ref, async ({ hostRef, groupName }) => {
      const hostname = await this.getField('host', hostRef, 'hostname')

      await linstorManagerCall(this, hostRef, 'setNodePreferredInterface', {
        groupName,
        hostname,
        name: interfaceName,
      })
    })
  }
}

decorateClass(Xostor, {
  createInterface: defer,
})
