import assert from 'assert'
import createLogger from '@xen-orchestra/log'
import forOwn from 'lodash/forOwn'
import fromEvent from 'promise-toolbox/fromEvent'
import { connect } from 'tls'

const log = createLogger('xo:xo-server:sdn-controller:ovsdb-client')

const OVSDB_PORT = 6640

// =============================================================================

export class OvsdbClient {
  constructor(host, clientKey, clientCert, caCert) {
    this._numberOfPortAndInterface = 0
    this._requestId = 0

    this._adding = []

    this.host = host

    this.updateCertificates(clientKey, clientCert, caCert)

    log.debug('New OVSDB client', {
      host: this.host.name_label,
    })
  }

  // ---------------------------------------------------------------------------

  updateCertificates(clientKey, clientCert, caCert) {
    this._clientKey = clientKey
    this._clientCert = clientCert
    this._caCert = caCert

    log.debug('Certificates have been updated', {
      host: this.host.name_label,
    })
  }

  // ---------------------------------------------------------------------------

  async addInterfaceAndPort(
    networkUuid,
    networkName,
    remoteAddress,
    encapsulation,
    key
  ) {
    if (
      this._adding.find(
        elem => elem.id === networkUuid && elem.addr === remoteAddress
      ) !== undefined
    ) {
      return
    }
    const adding = { id: networkUuid, addr: remoteAddress }
    this._adding.push(adding)

    const socket = await this._connect()
    const index = ++this._numberOfPortAndInterface
    const [bridgeUuid, bridgeName] = await this._getBridgeUuidForNetwork(
      networkUuid,
      networkName,
      socket
    )
    if (bridgeUuid === undefined) {
      socket.destroy()
      this._adding = this._adding.slice(this._adding.indexOf(adding), 1)
      return
    }

    const alreadyExist = await this._interfaceAndPortAlreadyExist(
      bridgeUuid,
      bridgeName,
      remoteAddress,
      socket
    )
    if (alreadyExist) {
      socket.destroy()
      this._adding = this._adding.slice(this._adding.indexOf(adding), 1)
      return bridgeName
    }

    const interfaceName = 'tunnel_iface' + index
    const portName = 'tunnel_port' + index

    // Add interface and port to the bridge
    const options = ['map', [['remote_ip', remoteAddress], ['key', key]]]
    const addInterfaceOperation = {
      op: 'insert',
      table: 'Interface',
      row: {
        type: encapsulation,
        options: options,
        name: interfaceName,
        other_config: ['map', [['private_pool_wide', 'true']]],
      },
      'uuid-name': 'new_iface',
    }
    const addPortOperation = {
      op: 'insert',
      table: 'Port',
      row: {
        name: portName,
        interfaces: ['set', [['named-uuid', 'new_iface']]],
        other_config: ['map', [['private_pool_wide', 'true']]],
      },
      'uuid-name': 'new_port',
    }
    const mutateBridgeOperation = {
      op: 'mutate',
      table: 'Bridge',
      where: [['_uuid', '==', ['uuid', bridgeUuid]]],
      mutations: [['ports', 'insert', ['set', [['named-uuid', 'new_port']]]]],
    }
    const params = [
      'Open_vSwitch',
      addInterfaceOperation,
      addPortOperation,
      mutateBridgeOperation,
    ]
    const jsonObjects = await this._sendOvsdbTransaction(params, socket)

    this._adding = this._adding.slice(this._adding.indexOf(adding), 1)
    if (jsonObjects === undefined) {
      socket.destroy()
      return
    }

    let error
    let details
    let i = 0
    let opResult
    do {
      opResult = jsonObjects[0].result[i]
      if (opResult !== undefined && opResult.error !== undefined) {
        error = opResult.error
        details = opResult.details
      }
      ++i
    } while (opResult !== undefined && error === undefined)

    if (error !== undefined) {
      log.error('Error while adding port and interface to bridge', {
        error,
        details,
        port: portName,
        interface: interfaceName,
        bridge: bridgeName,
        network: networkName,
        host: this.host.name_label,
      })
      socket.destroy()
      return
    }

    log.debug('Port and interface added to bridge', {
      port: portName,
      interface: interfaceName,
      bridge: bridgeName,
      network: networkName,
      host: this.host.name_label,
    })
    socket.destroy()
    return bridgeName
  }

  async resetForNetwork(networkUuid, networkName) {
    const socket = await this._connect()
    const [bridgeUuid, bridgeName] = await this._getBridgeUuidForNetwork(
      networkUuid,
      networkName,
      socket
    )
    if (bridgeUuid === undefined) {
      socket.destroy()
      return
    }

    // Delete old ports created by a SDN controller
    const ports = await this._getBridgePorts(bridgeUuid, bridgeName, socket)
    if (ports === undefined) {
      socket.destroy()
      return
    }
    const portsToDelete = []
    for (const port of ports) {
      const portUuid = port[1]

      const where = [['_uuid', '==', ['uuid', portUuid]]]
      const selectResult = await this._select(
        'Port',
        ['name', 'other_config'],
        where,
        socket
      )
      if (selectResult === undefined) {
        continue
      }

      forOwn(selectResult.other_config[1], config => {
        if (config[0] === 'private_pool_wide' && config[1] === 'true') {
          portsToDelete.push(['uuid', portUuid])
        }
      })
    }

    if (portsToDelete.length === 0) {
      // Nothing to do
      socket.destroy()
      return
    }

    const mutateBridgeOperation = {
      op: 'mutate',
      table: 'Bridge',
      where: [['_uuid', '==', ['uuid', bridgeUuid]]],
      mutations: [['ports', 'delete', ['set', portsToDelete]]],
    }

    const params = ['Open_vSwitch', mutateBridgeOperation]
    const jsonObjects = await this._sendOvsdbTransaction(params, socket)
    if (jsonObjects === undefined) {
      socket.destroy()
      return
    }
    if (jsonObjects[0].error != null) {
      log.error('Error while deleting ports from bridge', {
        error: jsonObjects[0].error,
        bridge: bridgeName,
        host: this.host.name_label,
      })
      socket.destroy()
      return
    }

    log.debug('Ports deleted from bridge', {
      nPorts: jsonObjects[0].result[0].count,
      bridge: bridgeName,
      host: this.host.name_label,
    })
    socket.destroy()
  }

  // ===========================================================================

  _parseJson(chunk) {
    let data = chunk.toString()
    let buffer = ''
    let depth = 0
    let pos = 0
    const objects = []

    for (let i = pos; i < data.length; ++i) {
      const c = data.charAt(i)
      if (c === '{') {
        ++depth
      } else if (c === '}') {
        --depth
        if (depth === 0) {
          const object = JSON.parse(buffer + data.substr(0, i + 1))
          objects.push(object)
          buffer = ''
          data = data.substr(i + 1)
          pos = 0
          i = -1
        }
      }
    }

    buffer += data
    return objects
  }

  // ---------------------------------------------------------------------------

  async _getBridgeUuidForNetwork(networkUuid, networkName, socket) {
    const where = [
      [
        'external_ids',
        'includes',
        ['map', [['xs-network-uuids', networkUuid]]],
      ],
    ]
    const selectResult = await this._select(
      'Bridge',
      ['_uuid', 'name'],
      where,
      socket
    )
    if (selectResult === undefined) {
      log.error('No bridge found for network', {
        network: networkName,
        host: this.host.name_label,
      })
      return []
    }

    const bridgeUuid = selectResult._uuid[1]
    const bridgeName = selectResult.name

    return [bridgeUuid, bridgeName]
  }

  async _interfaceAndPortAlreadyExist(
    bridgeUuid,
    bridgeName,
    remoteAddress,
    socket
  ) {
    const ports = await this._getBridgePorts(bridgeUuid, bridgeName, socket)
    if (ports === undefined) {
      return false
    }

    for (const port of ports) {
      const portUuid = port[1]
      const interfaces = await this._getPortInterfaces(portUuid, socket)
      if (interfaces === undefined) {
        continue
      }

      for (const iface of interfaces) {
        const interfaceUuid = iface[1]
        const hasRemote = await this._interfaceHasRemote(
          interfaceUuid,
          remoteAddress,
          socket
        )
        if (hasRemote) {
          return true
        }
      }
    }

    return false
  }

  async _getBridgePorts(bridgeUuid, bridgeName, socket) {
    const where = [['_uuid', '==', ['uuid', bridgeUuid]]]
    const selectResult = await this._select('Bridge', ['ports'], where, socket)
    if (selectResult === undefined) {
      return
    }

    return selectResult.ports[0] === 'set'
      ? selectResult.ports[1]
      : [selectResult.ports]
  }

  async _getPortInterfaces(portUuid, socket) {
    const where = [['_uuid', '==', ['uuid', portUuid]]]
    const selectResult = await this._select(
      'Port',
      ['name', 'interfaces'],
      where,
      socket
    )
    if (selectResult === undefined) {
      return
    }

    return selectResult.interfaces[0] === 'set'
      ? selectResult.interfaces[1]
      : [selectResult.interfaces]
  }

  async _interfaceHasRemote(interfaceUuid, remoteAddress, socket) {
    const where = [['_uuid', '==', ['uuid', interfaceUuid]]]
    const selectResult = await this._select(
      'Interface',
      ['name', 'options'],
      where,
      socket
    )
    if (selectResult === undefined) {
      return false
    }

    for (const option of selectResult.options[1]) {
      if (option[0] === 'remote_ip' && option[1] === remoteAddress) {
        return true
      }
    }

    return false
  }

  // ---------------------------------------------------------------------------

  async _select(table, columns, where, socket) {
    const selectOperation = {
      op: 'select',
      table: table,
      columns: columns,
      where: where,
    }

    const params = ['Open_vSwitch', selectOperation]
    const jsonObjects = await this._sendOvsdbTransaction(params, socket)
    if (jsonObjects === undefined) {
      return
    }
    const jsonResult = jsonObjects[0].result[0]
    if (jsonResult.error !== undefined) {
      log.error('Error while selecting columns', {
        error: jsonResult.error,
        details: jsonResult.details,
        columns,
        table,
        where,
        host: this.host.name_label,
      })
      return
    }

    if (jsonResult.rows.length === 0) {
      log.error('No result for select', {
        columns,
        table,
        where,
        host: this.host.name_label,
      })
      return
    }

    // For now all select operations should return only 1 row
    assert(
      jsonResult.rows.length === 1,
      `[${this.host.name_label}] There should be exactly 1 row when searching: '${columns}' in: '${table}' where: '${where}'`
    )

    return jsonResult.rows[0]
  }

  async _sendOvsdbTransaction(params, socket) {
    const stream = socket
    const requestId = ++this._requestId
    const req = {
      id: requestId,
      method: 'transact',
      params: params,
    }

    try {
      stream.write(JSON.stringify(req))
    } catch (error) {
      log.error('Error while writing into stream', {
        error,
        host: this.host.name_label,
      })
      return
    }

    let result
    let jsonObjects
    let resultRequestId
    do {
      try {
        result = await fromEvent(stream, 'data', {})
      } catch (error) {
        log.error('Error while waiting for stream data', {
          error,
          host: this.host.name_label,
        })
        return
      }

      jsonObjects = this._parseJson(result)
      resultRequestId = jsonObjects[0].id
    } while (resultRequestId !== requestId)

    return jsonObjects
  }

  // ---------------------------------------------------------------------------

  async _connect() {
    const options = {
      ca: this._caCert,
      key: this._clientKey,
      cert: this._clientCert,
      host: this.host.address,
      port: OVSDB_PORT,
      rejectUnauthorized: false,
      requestCert: false,
    }
    const socket = connect(options)

    try {
      await fromEvent(socket, 'secureConnect', {})
    } catch (error) {
      log.error('TLS connection failed', {
        error,
        code: error.code,
        host: this.host.name_label,
      })
      throw error
    }

    socket.on('error', error => {
      log.error('Socket error', {
        error,
        code: error.code,
        host: this.host.name_label,
      })
    })

    return socket
  }
}
