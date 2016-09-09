import highland from 'highland'
import findIndex from 'lodash/findIndex'
import includes from 'lodash/includes'
import { fromCallback } from 'promise-toolbox'

import { NoSuchObject } from '../api-errors'
import {
  forEach,
  generateUnsecureToken,
  isEmpty,
  streamToArray,
  throwFn
} from '../utils'

// ===================================================================

class NoSuchIpPool extends NoSuchObject {
  constructor (id) {
    super(id, 'ip pool')
  }
}

const normalize = ({
  addresses,
  id = throwFn('id is a required field'),
  name = '',
  networks
}) => ({
  addresses,
  id,
  name,
  networks
})

// ===================================================================

export default class IpPools {
  constructor (xo) {
    this._store = null
    this._xo = xo

    xo.on('start', async () => {
      this._store = await xo.getStore('ipPools')
    })
  }

  async createIpPool ({ addresses, name, networks }) {
    const id = await this._generateId()

    await this._save({
      addresses,
      id,
      name,
      networks
    })

    return id
  }

  async deleteIpPool (id) {
    const store = this._store

    if (await store.has(id)) {
      return store.del(id)
    }

    throw new NoSuchIpPool(id)
  }

  getAllIpPools () {
    return streamToArray(this._store.createValueStream(), {
      mapper: normalize
    })
  }

  getIpPool (id) {
    return this._store.get(id).then(normalize, error => {
      throw error.notFound ? new NoSuchIpPool(id) : error
    })
  }

  allocIpAddress (address, vifId) {
    // FIXME: does not work correctly if the address is in multiple
    // pools.
    return this._getForAddress(address).then(ipPool => {
      const data = ipPool.addresses[address]
      const vifs = data.vifs || (data.vifs = [])
      if (!includes(vifs, vifId)) {
        vifs.push(vifId)
        return this._save(ipPool)
      }
    })
  }

  deallocIpAddress (address, vifId) {
    return this._getForAddress(address).then(ipPool => {
      const data = ipPool.addresses[address]
      const vifs = data.vifs || (data.vifs = [])
      const i = findIndex(vifs, id => id === vifId)
      if (i !== -1) {
        vifs.splice(i, 1)
        return this._save(ipPool)
      }
    })
  }

  async updateIpPool (id, {
    addresses,
    name,
    networks
  }) {
    const ipPool = await this.getIpPool(id)

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

    await this._save(ipPool)
  }

  async _generateId () {
    let id
    do {
      id = generateUnsecureToken(8)
    } while (await this._store.has(id))
    return id
  }

  _getForAddress (address) {
    return fromCallback(cb => {
      highland(this._store.createValueStream()).find(ipPool => {
        const { addresses } = ipPool
        return addresses && addresses[address]
      }).pull(cb)
    })
  }

  _save (ipPool) {
    ipPool = normalize(ipPool)
    return this._store.put(ipPool.id, ipPool)
  }
}
