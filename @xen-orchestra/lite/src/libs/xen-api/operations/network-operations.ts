import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiHost, XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import type { BOND_MODE } from '@vates/types'

export function createNetworkOperations(xenApi: XenApi) {
  type NetworkRefs = MaybeArray<XenApiNetwork['$ref']>

  type BaseNetworkCreateParams = {
    nameLabel: string
    nameDescription?: string
    mtu?: number
    nbd?: boolean
    /** NBD in clear, only on a network dedicated to backups. Mutually exclusive with `nbd` */
    insecureNbd?: boolean
  }

  type NetworkCreateParams = BaseNetworkCreateParams & {
    vlan?: number
    pifRef: XenApiPif['$ref']
  }

  type BondedNetworkCreateParams = BaseNetworkCreateParams & {
    pifRefs: XenApiPif['$ref'][]
    bondMode: BOND_MODE
  }

  const createEmptyNetwork = (nameLabel: string, nameDescription: string, mtu: number) =>
    xenApi.call<XenApiNetwork['$ref']>('network.create', [
      {
        name_label: nameLabel,
        name_description: nameDescription,
        MTU: mtu,
        other_config: { automatic: 'false' },
      },
    ])

  // nbd and insecure_nbd are incompatible purposes, at most one of them is added
  const addNbdPurpose = async (networkRef: XenApiNetwork['$ref'], { nbd, insecureNbd }: BaseNetworkCreateParams) => {
    if (nbd) {
      await xenApi.call('network.add_purpose', [networkRef, 'nbd'])
    } else if (insecureNbd) {
      await xenApi.call('network.add_purpose', [networkRef, 'insecure_nbd'])
    }
  }

  return {
    create: async (params: NetworkCreateParams): Promise<XenApiNetwork['$ref']> => {
      const { nameLabel, nameDescription = '', mtu = 1500, vlan = 0, pifRef } = params

      const networkRef = await createEmptyNetwork(nameLabel, nameDescription, mtu)

      try {
        await xenApi.call('pool.create_VLAN_from_PIF', [pifRef, networkRef, vlan])

        await addNbdPurpose(networkRef, params)
      } catch (error) {
        await xenApi.call('network.destroy', [networkRef])
        throw error
      }

      return networkRef
    },

    createBonded: async (params: BondedNetworkCreateParams): Promise<XenApiNetwork['$ref']> => {
      const { nameLabel, nameDescription = '', mtu = 1500, pifRefs, bondMode } = params

      const networkRef = await createEmptyNetwork(nameLabel, nameDescription, mtu)

      try {
        const networkRefs = await Promise.all(
          pifRefs.map(pifRef => xenApi.getField<XenApiNetwork['$ref']>('PIF', pifRef, 'network'))
        )

        const pifRefsByNetwork = await Promise.all(
          networkRefs.map(pifNetworkRef => xenApi.getField<XenApiPif['$ref'][]>('network', pifNetworkRef, 'PIFs'))
        )
        const allPifRefs = pifRefsByNetwork.flat()

        const hostRefs = await Promise.all(
          allPifRefs.map(pifRef => xenApi.getField<XenApiHost['$ref']>('PIF', pifRef, 'host'))
        )

        const pifRefsByHost = new Map<XenApiHost['$ref'], XenApiPif['$ref'][]>()
        for (const [index, pifRef] of allPifRefs.entries()) {
          const hostRef = hostRefs[index]
          const group = pifRefsByHost.get(hostRef) ?? []
          group.push(pifRef)
          pifRefsByHost.set(hostRef, group)
        }

        await Promise.all(
          Array.from(pifRefsByHost.values()).map(pifRefsForHost =>
            xenApi.call('Bond.create', [networkRef, pifRefsForHost, '', bondMode])
          )
        )

        await addNbdPurpose(networkRef, params)
      } catch (error) {
        await xenApi.call('network.destroy', [networkRef])
        throw error
      }

      return networkRef
    },

    createInternal: async (params: BaseNetworkCreateParams): Promise<XenApiNetwork['$ref']> => {
      const { nameLabel, nameDescription = '', mtu = 1500 } = params

      const networkRef = await createEmptyNetwork(nameLabel, nameDescription, mtu)

      try {
        await addNbdPurpose(networkRef, params)
      } catch (error) {
        await xenApi.call('network.destroy', [networkRef])
        throw error
      }

      return networkRef
    },

    delete: (networkRefs: NetworkRefs) =>
      Promise.allSettled(toArray(networkRefs).map(networkRef => xenApi.call('network.destroy', [networkRef]))),
  }
}
