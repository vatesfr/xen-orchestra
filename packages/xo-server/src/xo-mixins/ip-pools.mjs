import concat from 'lodash/concat.js'
import countBy from 'lodash/countBy.js'
import diff from 'lodash/difference.js'
import findIndex from 'lodash/findIndex.js'
import flatten from 'lodash/flatten.js'
import highland from 'highland'
import includes from 'lodash/includes.js'
import isObject from 'lodash/isObject.js'
import keys from 'lodash/keys.js'
import mapToArray from 'lodash/map.js'
import mapValues from 'lodash/mapValues.js'
import pick from 'lodash/pick.js'
import remove from 'lodash/remove.js'
import { noSuchObject } from 'xo-common/api-errors.js'
import { fromCallback } from 'promise-toolbox'
import { synchronized } from 'decorator-synchronized'

import { forEach, generateUnsecureToken, isEmpty, lightSet, streamToArray, throwFn } from '../utils.mjs'

// ===================================================================

const normalize = ({ addresses, id = throwFn('id is a required field'), name = '', networks, resourceSets }) => ({
  addresses,
  id,
  name,
  networks,
  resourceSets,
})

const _isAddressInIpPool = (address, network, ipPool) =>
  ipPool.addresses && address in ipPool.addresses && includes(ipPool.networks, isObject(network) ? network.id : network)

// ===================================================================

// Note: an address cannot be in two different pools sharing a
// network.
export default class IpPools {
  constructor(app) {
    this._store = null
    this._app = app

    app.hooks.on('start', async () => {
      this._store = await app.getStore('ipPools')

      app.addConfigManager(
        'ipPools',
        () => this.getAllIpPools(),
        ipPools => Promise.all(ipPools.map(ipPool => this._save(ipPool)))
      )
    })
  }

  async createIpPool({ addresses, name, networks }) {
    const id = await this._generateId()

    await this._save({
      addresses,
      id,
      name,
      networks,
    })

    return id
  }

  async deleteIpPool(id) {
    const store = this._store

    if (await store.has(id)) {
      await Promise.all(
        (await this._app.getAllResourceSets()).map(async set => {
          await this._app.removeLimitFromResourceSet(`ipPool:${id}`, set.id)
          return this._app.removeIpPoolFromResourceSet(id, set.id)
        })
      )
      await this._removeIpAddressesFromVifs(mapValues((await this.getIpPool(id)).addresses, 'vifs'))

      return store.del(id)
    }

    throw noSuchObject(id, 'ipPool')
  }

  _getAllIpPools(filter) {
    return streamToArray(this._store.createValueStream(), {
      filter,
      mapper: normalize,
    })
  }

  async getAllIpPools(userId) {
    let filter
    if (userId != null) {
      const user = await this._app.getUser(userId)
      if (user.permission !== 'admin') {
        const resourceSets = await this._app.getAllResourceSets(userId)
        const ipPools = lightSet(flatten(resourceSets.map(_ => _.ipPools)))
        filter = ({ id }) => ipPools.has(id)
      }
    }

    return this._getAllIpPools(filter)
  }

  getIpPool(id) {
    return this._store.get(id).then(normalize, error => {
      throw error.notFound ? noSuchObject(id, 'ipPool') : error
    })
  }

  async _getAddressIpPool(address, network) {
    const ipPools = await this._getAllIpPools(ipPool => _isAddressInIpPool(address, network, ipPool))

    return ipPools && ipPools[0]
  }

  // Returns a map that indicates how many IPs from each IP pool the VM uses
  // e.g.: { 'ipPool:abc': 3, 'ipPool:xyz': 7 }
  async computeVmIpPoolsUsage(vm) {
    const vifs = vm.VIFs
    const ipPools = []
    for (const vifId of vifs) {
      const { allowedIpv4Addresses, allowedIpv6Addresses, $network } = this._app.getObject(vifId)

      for (const address of concat(allowedIpv4Addresses, allowedIpv6Addresses)) {
        const ipPool = await this._getAddressIpPool(address, $network)
        ipPool && ipPools.push(ipPool.id)
      }
    }

    return countBy(ipPools, id => `ipPool:${id}`)
  }

  @synchronized()
  allocIpAddresses(vifId, addAddresses, removeAddresses) {
    const updatedIpPools = {}
    const limits = {}

    const xoVif = this._app.getObject(vifId)
    const xapi = this._app.getXapi(xoVif)
    const vif = xapi.getObject(xoVif._xapiId)

    const allocAndSave = (() => {
      const resourceSetId = xapi.xo.getData(vif.VM, 'resourceSet')

      return () => {
        const saveIpPools = () => Promise.all(mapToArray(updatedIpPools, ipPool => this._save(ipPool)))
        return resourceSetId
          ? this._app.allocateLimitsInResourceSet(limits, resourceSetId).then(saveIpPools)
          : saveIpPools()
      }
    })()

    return fromCallback(cb => {
      const network = vif.$network
      const networkId = network.$id

      const isVif = id => id === vifId

      highland(this._store.createValueStream())
        .each(ipPool => {
          const { addresses, networks } = updatedIpPools[ipPool.id] || ipPool
          if (!(addresses && networks && includes(networks, networkId))) {
            return false
          }

          let allocations = 0
          let changed = false
          forEach(removeAddresses, address => {
            let vifs, i
            if ((vifs = addresses[address]) && (vifs = vifs.vifs) && (i = findIndex(vifs, isVif)) !== -1) {
              vifs.splice(i, 1)
              --allocations
              changed = true
            }
          })
          forEach(addAddresses, address => {
            const data = addresses[address]
            if (!data) {
              return
            }
            const vifs = data.vifs || (data.vifs = [])
            if (!includes(vifs, vifId)) {
              vifs.push(vifId)
              ++allocations
              changed = true
            }
          })

          if (changed) {
            const { id } = ipPool
            updatedIpPools[id] = ipPool
            limits[`ipPool:${id}`] = (limits[`ipPool:${id}`] || 0) + allocations
          }
        })
        .toCallback(cb)
    }).then(allocAndSave)
  }

  async _removeIpAddressesFromVifs(mapAddressVifs) {
    const mapVifAddresses = {}
    forEach(mapAddressVifs, (vifs, address) => {
      forEach(vifs, vifId => {
        if (mapVifAddresses[vifId]) {
          mapVifAddresses[vifId].push(address)
        } else {
          mapVifAddresses[vifId] = [address]
        }
      })
    })

    const { getXapi } = this._app
    return Promise.all(
      mapToArray(mapVifAddresses, (addresses, vifId) => {
        let vif
        try {
          // The IP may not have been correctly deallocated from the IP pool when the VIF was deleted
          vif = this._app.getObject(vifId)
        } catch (error) {
          return
        }
        const { allowedIpv4Addresses, allowedIpv6Addresses } = vif
        remove(allowedIpv4Addresses, address => includes(addresses, address))
        remove(allowedIpv6Addresses, address => includes(addresses, address))
        this.allocIpAddresses(vifId, undefined, concat(allowedIpv4Addresses, allowedIpv6Addresses))

        return getXapi(vif).editVif(vif._xapiId, {
          ipv4Allowed: allowedIpv4Addresses,
          ipv6Allowed: allowedIpv6Addresses,
        })
      })
    )
  }

  async updateIpPool(id, { addresses, name, networks, resourceSets }) {
    const ipPool = await this.getIpPool(id)
    const previousAddresses = { ...ipPool.addresses }

    name != null && (ipPool.name = name)
    if (addresses) {
      const addresses_ = ipPool.addresses || {}
      forEach(addresses, (props, address) => {
        if (props === null) {
          delete addresses_[address]
        } else {
          addresses_[address] = props
        }
      })

      // Remove the addresses that are no longer in the IP pool from the concerned VIFs
      const deletedAddresses = diff(keys(previousAddresses), keys(addresses_))
      await this._removeIpAddressesFromVifs(pick(previousAddresses, deletedAddresses))

      if (isEmpty(addresses_)) {
        delete ipPool.addresses
      } else {
        ipPool.addresses = addresses_
      }
    }

    // TODO: Implement patching like for addresses.
    if (networks) {
      ipPool.networks = networks
    }

    // TODO: Implement patching like for addresses.
    if (resourceSets) {
      ipPool.resourceSets = resourceSets
    }

    await this._save(ipPool)
  }

  async _generateId() {
    let id
    do {
      id = generateUnsecureToken(8)
    } while (await this._store.has(id))
    return id
  }

  _save(ipPool) {
    ipPool = normalize(ipPool)
    return this._store.put(ipPool.id, ipPool)
  }
}
