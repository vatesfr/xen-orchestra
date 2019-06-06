import assert from 'assert'
import { connect } from 'tls'
import createLogger from '@xen-orchestra/log'
import forOwn from 'lodash/forOwn'
import fromEvent from 'promise-toolbox/fromEvent'
import { readFileSync } from 'fs'

const log = createLogger('xo:xo-server:sdn-controller:ovsdb-client')

const CLIENT_PORT = 6640 // Standard OVSDB port

export class OVSDBClient {
  constructor(host) {
    this._host = host
    this._numberOfPortAndInterface = 0
    this._requestID = 0

    log.debug(`New OVSDB client for '${this._host.name_label}'`)
  }

  get address() {
    return this._host.address
  }

  get host() {
    return this._host.$ref
  }

  parseJson(chunk) {
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

  async addInterfaceAndPort(networkUuid, networkName, remoteAddress) {
    const socket = await this.connect()
    if (!socket) {
      return
    }
    const stream = socket

    const index = this._numberOfPortAndInterface
    ++this._numberOfPortAndInterface

    const [bridgeUuid, bridgeName] = await this.getBridgeUuidForNetwork(
      networkUuid,
      networkName,
      socket
    )
    if (!bridgeUuid) {
      socket.destroy()
      return
    }

    if (
      await this.interfaceAndPortAlreadyExist(
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
    const req = {
      id: this._requestID++,
      method: 'transact',
      params: [
        'Open_vSwitch',
        addInterfaceOperation,
        addPortOperation,
        mutateBridgeOperation,
      ],
    }

    stream.write(JSON.stringify(req))
    let result
    try {
      result = await fromEvent(stream, 'data', {})
    } catch (error) {
      log.error(
        `[${this._host.name_label}] Error while writing into stream: ${error}`
      )
      socket.destroy()
      return
    }

    const jsonObjects = this.parseJson(result)

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

    socket.destroy()
    log.debug(
      `[${
        this._host.name_label
      }] Port: '${portName}' and interface: '${interfaceName}' added to bridge: '${bridgeName}' on network: '${networkName}'`
    )
  }

  async resetForNetwork(networkUuid, networkName) {
    const socket = await this.connect()
    if (!socket) {
      return
    }
    const stream = socket

    const [bridgeUuid, bridgeName] = await this.getBridgeUuidForNetwork(
      networkUuid,
      networkName,
      socket
    )
    if (!bridgeUuid) {
      socket.destroy()
      return
    }

    // Delete old ports created by a SDN controller
    const ports = await this.getBridgePorts(bridgeUuid, bridgeName, socket)
    if (!ports) {
      socket.destroy()
      return
    }
    const portsToDelete = []
    let i
    for (i = 0; i < ports.length; ++i) {
      const portUuid = ports[i][1]

      const where = [['_uuid', '==', ['uuid', portUuid]]]
      const selectResult = await this.select(
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
    const req = {
      id: this._requestID++,
      method: 'transact',
      params: ['Open_vSwitch', mutateBridgeOperation],
    }

    stream.write(JSON.stringify(req))

    let result
    try {
      result = await fromEvent(stream, 'data', {})
    } catch (error) {
      log.error(
        `[${this._host.name_label}] Error while writing into stream: ${error}`
      )
      socket.destroy()
      return
    }

    const jsonObjects = this.parseJson(result)
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
      } ports from bridge: ${bridgeName}`
    )

    socket.destroy()
  }

  async getBridgeUuidForNetwork(networkUuid, networkName, socket) {
    const where = [
      [
        'external_ids',
        'includes',
        ['map', [['xs-network-uuids', networkUuid]]],
      ],
    ]
    const selectResult = await this.select(
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

  async interfaceAndPortAlreadyExist(
    bridgeUuid,
    bridgeName,
    remoteAddress,
    socket
  ) {
    const ports = await this.getBridgePorts(bridgeUuid, bridgeName, socket)
    if (!ports) {
      return
    }

    let i
    for (i = 0; i < ports.length; ++i) {
      const portUuid = ports[i][1]
      const interfaces = await this.getPortInterfaces(portUuid, socket)
      if (!interfaces) {
        continue
      }

      let j
      for (j = 0; j < interfaces.length; ++j) {
        const interfaceUuid = interfaces[j][1]
        if (
          await this.interfaceHasRemote(interfaceUuid, remoteAddress, socket)
        ) {
          return true
        }
      }
    }

    return false
  }

  async getBridgePorts(bridgeUuid, bridgeName, socket) {
    const where = [['_uuid', '==', ['uuid', bridgeUuid]]]
    const selectResult = await this.select('Bridge', ['ports'], where, socket)
    if (!selectResult) {
      return null
    }

    return selectResult.ports[0] === 'set'
      ? selectResult.ports[1]
      : [selectResult.ports]
  }

  async getPortInterfaces(portUuid, socket) {
    const where = [['_uuid', '==', ['uuid', portUuid]]]
    const selectResult = await this.select(
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

  async interfaceHasRemote(interfaceUuid, remoteAddress, socket) {
    const where = [['_uuid', '==', ['uuid', interfaceUuid]]]
    const selectResult = await this.select(
      'Interface',
      ['name', 'options'],
      where,
      socket
    )
    if (!selectResult) {
      return false
    }

    let i
    for (i = 0; i < selectResult.options[1].length; ++i) {
      const option = selectResult.options[1][i]
      if (option[0] === 'remote_ip' && option[1] === remoteAddress) {
        return true
      }
    }

    return false
  }

  async select(table, columns, where, socket) {
    const stream = socket

    const selectOperation = {
      op: 'select',
      table: table,
      columns: columns,
      where: where,
    }
    const req = {
      id: this._requestID++,
      method: 'transact',
      params: ['Open_vSwitch', selectOperation],
    }

    stream.write(JSON.stringify(req))

    let result
    try {
      result = await fromEvent(stream, 'data', {})
    } catch (error) {
      log.error(
        `[${this._host.name_label}] Error while writing into stream: ${error}`
      )
      return null
    }

    const jsonObjects = this.parseJson(result)
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

  async connect() {
    // Connect to OVSDB server
    // TODO: Use secure connection
    /*
    const socket = connect(
      CLIENT_PORT,
      this._host.address
    )

    try {
      await fromEvent(socket, 'connect', {})
    } catch (error) {
      log.error(
        `Connection to: '${this._host.name_label}' failed because: ${error}`
      )
      return null
    }
    */

    const options = {
      // TODO: put in plugin config?
      ca: readFileSync('ca-crt.pem'),
      key: readFileSync('client1-key.pem'),
      cert: readFileSync('client1-crt.pem'),
      host: this._host.address,
      port: CLIENT_PORT,
      rejectUnauthorized: false,
      requestCert: false,
    }
    const socket = connect(options)

    try {
      await fromEvent(socket, 'secureConnect', {})
    } catch (error) {
      log.error(
        `Connection to: '${this._host.name_label}' failed because: ${error}: ${
          error.code
        }`
      )
      return null
    }

    log.debug(`Connection successful to: '${this._host.name_label}'`)

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
