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
    this._host = host
    this._numberOfPortAndInterface = 0
    this._requestID = 0

    this.updateCertificates(clientKey, clientCert, caCert)

    log.debug(`[${this._host.name_label}] New OVSDB client`)
  }

  // ---------------------------------------------------------------------------

  get address() {
    return this._host.address
  }

  get host() {
    return this._host.$ref
  }

  get id() {
    return this._host.$id
  }

  updateCertificates(clientKey, clientCert, caCert) {
    this._clientKey = clientKey
    this._clientCert = clientCert
    this._caCert = caCert

    log.debug(`[${this._host.name_label}] Certificates have been updated`)
  }

  // ---------------------------------------------------------------------------

  async addInterfaceAndPort(networkUuid, networkName, remoteAddress) {
    const socket = await this._connect()
    if (!socket) {
      log.error(`[${this._host.name_label}] No TLS socket available`)
      return
    }

    const index = this._numberOfPortAndInterface
    ++this._numberOfPortAndInterface

    const [bridgeUuid, bridgeName] = await this._getBridgeUuidForNetwork(
      networkUuid,
      networkName,
      socket
    )
    if (!bridgeUuid) {
      socket.destroy()
      return
    }

    if (
      await this._interfaceAndPortAlreadyExist(
        bridgeUuid,
        bridgeName,
        remoteAddress,
        socket
      )
    ) {
      socket.destroy()
      return
    }

    const interfaceName = 'tunnel_iface' + index
    const portName = 'tunnel_port' + index

    // Add interface and port to the bridge
    const addInterfaceOperation = {
      op: 'insert',
      table: 'Interface',
      row: {
        type: 'gre',
        options: ['map', [['remote_ip', remoteAddress]]],
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
    if (!jsonObjects) {
      socket.destroy()
      return
    }

    let error
    let details
    let i = 0
    let opResult
    do {
      opResult = jsonObjects[0].result[i]
      if (opResult && opResult.error) {
        error = opResult.error
        details = opResult.details
      }
      ++i
    } while (opResult && !error)

    if (error) {
      log.error(
        `[${
          this._host.name_label
        }] Error while adding port: '${portName}' and interface: '${interfaceName}' to bridge: '${bridgeName}' on network: '${networkName}' because: ${error}: ${details}`
      )
      socket.destroy()
      return
    }

    log.debug(
      `[${
        this._host.name_label
      }] Port: '${portName}' and interface: '${interfaceName}' added to bridge: '${bridgeName}' on network: '${networkName}'`
    )
    socket.destroy()
  }

  async resetForNetwork(networkUuid, networkName) {
    const socket = await this._connect()
    if (!socket) {
      log.error(`[${this._host.name_label}] No TLS socket available`)
      return
    }

    const [bridgeUuid, bridgeName] = await this._getBridgeUuidForNetwork(
      networkUuid,
      networkName,
      socket
    )
    if (!bridgeUuid) {
      socket.destroy()
      return
    }

    // Delete old ports created by a SDN controller
    const ports = await this._getBridgePorts(bridgeUuid, bridgeName, socket)
    if (!ports) {
      socket.destroy()
      return
    }
    const portsToDelete = []
    for (let i = 0; i < ports.length; ++i) {
      const portUuid = ports[i][1]

      const where = [['_uuid', '==', ['uuid', portUuid]]]
      const selectResult = await this._select(
        'Port',
        ['name', 'other_config'],
        where,
        socket
      )
      if (!selectResult) {
        continue
      }

      forOwn(selectResult.other_config[1], config => {
        if (config[0] === 'private_pool_wide' && config[1] === 'true') {
          log.debug(
            `[${this._host.name_label}] Adding port: '${
              selectResult.name
            }' to delete list from bridge: '${bridgeName}'`
          )
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
    if (!jsonObjects) {
      socket.destroy()
      return
    }
    if (jsonObjects[0].error) {
      log.error(
        `[${
          this._host.name_label
        }] Couldn't delete ports from bridge: '${bridgeName}' because: ${
          jsonObjects.error
        }`
      )
      socket.destroy()
      return
    }

    log.debug(
      `[${this._host.name_label}] Deleted ${
        jsonObjects[0].result[0].count
      } ports from bridge: '${bridgeName}'`
    )
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
        depth++
      } else if (c === '}') {
        depth--
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
    if (!selectResult) {
      return [null, null]
    }

    const bridgeUuid = selectResult._uuid[1]
    const bridgeName = selectResult.name
    log.debug(
      `[${
        this._host.name_label
      }] Found bridge: '${bridgeName}' for network: '${networkName}'`
    )

    return [bridgeUuid, bridgeName]
  }

  async _interfaceAndPortAlreadyExist(
    bridgeUuid,
    bridgeName,
    remoteAddress,
    socket
  ) {
    const ports = await this._getBridgePorts(bridgeUuid, bridgeName, socket)
    if (!ports) {
      return
    }

    for (let i = 0; i < ports.length; ++i) {
      const portUuid = ports[i][1]
      const interfaces = await this._getPortInterfaces(portUuid, socket)
      if (!interfaces) {
        continue
      }

      let j
      for (j = 0; j < interfaces.length; ++j) {
        const interfaceUuid = interfaces[j][1]
        if (
          await this._interfaceHasRemote(interfaceUuid, remoteAddress, socket)
        ) {
          return true
        }
      }
    }

    return false
  }

  async _getBridgePorts(bridgeUuid, bridgeName, socket) {
    const where = [['_uuid', '==', ['uuid', bridgeUuid]]]
    const selectResult = await this._select('Bridge', ['ports'], where, socket)
    if (!selectResult) {
      return null
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
    if (!selectResult) {
      return null
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
    if (!selectResult) {
      return false
    }

    for (let i = 0; i < selectResult.options[1].length; ++i) {
      const option = selectResult.options[1][i]
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
    if (!jsonObjects) {
      return
    }
    const jsonResult = jsonObjects[0].result[0]
    if (jsonResult.error) {
      log.error(
        `[${
          this._host.name_label
        }] Couldn't retrieve: '${columns}' in: '${table}' because: ${
          jsonResult.error
        }: ${jsonResult.details}`
      )
      return null
    }

    if (jsonResult.rows.length === 0) {
      log.error(
        `[${
          this._host.name_label
        }] No '${columns}' found in: '${table}' where: '${where}'`
      )
      return null
    }

    // For now all select operations should return only 1 row
    assert(
      jsonResult.rows.length === 1,
      `[${
        this._host.name_label
      }] There should exactly 1 row when searching: '${columns}' in: '${table}' where: '${where}'`
    )

    return jsonResult.rows[0]
  }

  async _sendOvsdbTransaction(params, socket) {
    const stream = socket

    const requestId = this._requestID
    ++this._requestID
    const req = {
      id: requestId,
      method: 'transact',
      params: params,
    }

    try {
      stream.write(JSON.stringify(req))
    } catch (error) {
      log.error(
        `[${this._host.name_label}] Error while writing into stream: ${error}`
      )
      return null
    }

    let result
    let jsonObjects
    let resultRequestId
    do {
      try {
        result = await fromEvent(stream, 'data', {})
      } catch (error) {
        log.error(
          `[${
            this._host.name_label
          }] Error while waiting for stream data: ${error}`
        )
        return null
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
      host: this._host.address,
      port: OVSDB_PORT,
      rejectUnauthorized: false,
      requestCert: false,
    }
    const socket = connect(options)

    try {
      await fromEvent(socket, 'secureConnect', {})
    } catch (error) {
      log.error(
        `[${this._host.name_label}] TLS connection failed because: ${error}: ${
          error.code
        }`
      )
      return null
    }

    log.debug(`[${this._host.name_label}] TLS connection successful`)

    socket.on('error', error => {
      log.error(
        `[${
          this._host.name_label
        }] OVSDB client socket error: ${error} with code: ${error.code}`
      )
    })

    return socket
  }
}
