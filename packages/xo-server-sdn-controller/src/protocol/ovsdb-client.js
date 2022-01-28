import assert from 'assert'
import fromEvent from 'promise-toolbox/fromEvent'
import { createLogger } from '@xen-orchestra/log'
import { forOwn, toPairs } from 'lodash'

// =============================================================================

const log = createLogger('xo:xo-server:sdn-controller:ovsdb-client')

const OVSDB_PORT = 6640
const PROTOCOLS = 'OpenFlow11' // Supported OpenFlow versions
const TARGET = 'pssl:' // OpenFlow Controller target

// =============================================================================

function toMap(object) {
  return ['map', toPairs(object)]
}

function setFromSelect(object) {
  return object[0] === 'set' ? object[1] : [object]
}

// =============================================================================

export class OvsdbClient {
  /*
  Create an SSL connection to an XCP-ng host.
  Interact with the host's OpenVSwitch (OVS) daemon to create and manage the virtual bridges
  corresponding to the private networks with OVSDB (OpenVSwitch DataBase) Protocol.
  See:
  - OVSDB Protocol: https://tools.ietf.org/html/rfc7047
  - OVS Tunneling : http://docs.openvswitch.org/en/latest/howto/tunneling/
  - OVS IPSEC     : http://docs.openvswitch.org/en/latest/howto/ipsec/

  Attributes on created OVS ports (corresponds to a XAPI `PIF` or `VIF`):
  - `other_config`:
    - `xo:sdn-controller:private-network-uuid`: UUID of the private network

  Attributes on created OVS interfaces:
  - `options`:
    - `key`      : Network's VNI
    - `remote_ip`: Remote IP of the tunnel
  */

  constructor(host, tlsHelper) {
    this._numberOfPortAndInterface = 0
    this._requestId = 0

    this._adding = []

    this.host = host

    this._tlsHelper = tlsHelper

    log.debug('New OVSDB client', {
      host: this.host.name_label,
    })
  }

  // ---------------------------------------------------------------------------

  async addInterfaceAndPort(network, remoteAddress, encapsulation, key, password, privateNetworkUuid) {
    if (this._adding.find(elem => elem.id === network.uuid && elem.addr === remoteAddress) !== undefined) {
      return
    }
    const adding = { id: network.uuid, addr: remoteAddress }
    this._adding.push(adding)
    let socket
    try {
      socket = await this._connect()
    } catch (error) {
      this._adding = this._adding.filter(elem => elem.id !== network.uuid || elem.addr !== remoteAddress)
      return
    }

    const bridge = await this._getBridgeForNetwork(network, socket)
    if (bridge.uuid === undefined) {
      socket.destroy()
      this._adding = this._adding.filter(elem => elem.id !== network.uuid || elem.addr !== remoteAddress)
      return
    }

    const port = await this._interfaceAndPortAlreadyExist(bridge, remoteAddress, socket)
    if (port !== undefined) {
      if (password === undefined) {
        socket.destroy()
        this._adding = this._adding.filter(elem => elem.id !== network.uuid || elem.addr !== remoteAddress)
        return bridge.name
      }

      // Remove port and interface to recreate it with new password
      try {
        await this._removePortsFromBridge(bridge, port, socket)
      } catch (error) {
        socket.destroy()
        this._adding = this._adding.filter(elem => elem.id !== network.uuid || elem.addr !== remoteAddress)
        log.error('Error while deleting port for encrypted password update', {
          error,
        })
        return
      }
    }

    const index = ++this._numberOfPortAndInterface
    const interfaceName = bridge.name + '_iface' + index
    const portName = bridge.name + '_port' + index

    // Add interface and port to the bridge
    const options = { remote_ip: remoteAddress, key }
    if (password !== undefined) {
      options.psk = password
    }
    const addInterfaceOperation = {
      op: 'insert',
      table: 'Interface',
      row: {
        type: encapsulation,
        options: toMap(options),
        name: interfaceName,
      },
      'uuid-name': 'new_iface',
    }

    const addPortOperation = {
      op: 'insert',
      table: 'Port',
      row: {
        name: portName,
        interfaces: ['named-uuid', 'new_iface'],
        other_config: toMap({
          'xo:sdn-controller:private-network-uuid': privateNetworkUuid,
        }),
      },
      'uuid-name': 'new_port',
    }

    const mutateBridgeOperation = {
      op: 'mutate',
      table: 'Bridge',
      where: [['_uuid', '==', ['uuid', bridge.uuid]]],
      mutations: [['ports', 'insert', ['named-uuid', 'new_port']]],
    }
    const params = ['Open_vSwitch', addInterfaceOperation, addPortOperation, mutateBridgeOperation]
    const jsonObjects = await this._sendOvsdbTransaction(params, socket)

    this._adding = this._adding.filter(elem => elem.id !== network.uuid || elem.addr !== remoteAddress)
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
      if (opResult?.error !== undefined) {
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
        bridge: bridge.name,
        network: network.name_label,
        host: this.host.name_label,
      })
      socket.destroy()
      return
    }

    log.debug('Port and interface added to bridge', {
      port: portName,
      interface: interfaceName,
      bridge: bridge.name,
      network: network.name_label,
      host: this.host.name_label,
    })
    socket.destroy()
    return bridge.name
  }

  async resetForNetwork(network, privateNetworkUuid) {
    const socket = await this._connect()
    const bridge = await this._getBridgeForNetwork(network, socket)
    if (bridge.uuid === undefined) {
      socket.destroy()
      return
    }

    // Delete old ports created by a SDN controller
    const ports = await this._getBridgePorts(bridge, socket)
    if (ports === undefined) {
      socket.destroy()
      return
    }
    const portsToDelete = []
    for (const port of ports) {
      const portUuid = port[1]

      const where = [['_uuid', '==', ['uuid', portUuid]]]
      const selectResult = await this._select('Port', ['name', 'other_config'], where, socket)
      if (selectResult === undefined) {
        continue
      }

      forOwn(selectResult.other_config[1], config => {
        // 2019-09-03
        // Compatibility code, to be removed in 1 year.
        const oldShouldDelete =
          config[0] === 'private_pool_wide' ||
          config[0] === 'cross_pool' ||
          config[0] === 'xo:sdn-controller:private-pool-wide' ||
          config[0] === 'xo:sdn-controller:cross-pool'

        const shouldDelete = config[0] === 'xo:sdn-controller:private-network-uuid' && config[1] === privateNetworkUuid

        if (shouldDelete || oldShouldDelete) {
          portsToDelete.push(['uuid', portUuid])
        }
      })
    }

    if (portsToDelete.length === 0) {
      // Nothing to do
      socket.destroy()
      return
    }

    try {
      await this._removePortsFromBridge(bridge, ['set', portsToDelete], socket)
    } catch (error) {
      log.error('Error while deleting ports for network reset', { error })
    }

    socket.destroy()
  }

  async setBridgeController() {
    const socket = await this._connect()
    // Add controller to openvswitch table if needed
    const params = ['Open_vSwitch']

    params.push({
      op: 'insert',
      table: 'Controller',
      row: {
        target: TARGET,
      },
      'uuid-name': 'new_controller',
    })

    const networks = this.host.$PIFs.map(pif => pif?.$network)
    for (const network of networks) {
      // network can be undefined so we can't set its controller
      // It can happen if there's a ref problem within XAPI
      if (network === undefined) {
        continue
      }

      const bridge = await this._getBridgeForNetwork(network, socket)
      if (bridge.uuid === undefined) {
        continue
      }

      if (await this._bridgeAlreadyControlled(bridge, socket)) {
        continue
      }

      params.push({
        op: 'mutate',
        table: 'Bridge',
        where: [['_uuid', '==', ['uuid', bridge.uuid]]],
        mutations: [
          ['controller', 'insert', ['named-uuid', 'new_controller']],
          ['protocols', 'insert', PROTOCOLS],
        ],
      })
    }

    const jsonObjects = await this._sendOvsdbTransaction(params, socket)
    if (jsonObjects === undefined) {
      socket.destroy()
      return
    }
    if (jsonObjects[0].error !== null) {
      log.error('Error while setting controller', {
        error: jsonObjects[0].error,
        host: this.host.name_label,
      })
    } else {
      this._controllerUuid = jsonObjects[0].result[0].uuid[1]
      log.info('Controller set', { host: this.host.name_label })
    }

    socket.destroy()
  }

  async setBridgeControllerForNetwork(network) {
    const socket = await this._connect()
    if (this._controllerUuid === undefined) {
      const where = [['target', '==', TARGET]]
      const selectResult = await this._select('Controller', ['_uuid'], where, socket)

      this._controllerUuid = selectResult._uuid[1]
    }
    assert.notStrictEqual(this._controllerUuid, undefined)

    const bridge = await this._getBridgeForNetwork(network, socket)
    if (bridge.uuid === undefined) {
      socket.destroy()
      return
    }

    if (await this._bridgeAlreadyControlled(bridge, socket)) {
      socket.destroy()
      return
    }

    const mutateOperation = {
      op: 'mutate',
      table: 'Bridge',
      where: [['_uuid', '==', ['uuid', bridge.uuid]]],
      mutations: [
        ['controller', 'insert', ['uuid', this._controllerUuid]],
        ['protocols', 'insert', PROTOCOLS],
      ],
    }

    const params = ['Open_vSwitch', mutateOperation]
    const jsonObjects = await this._sendOvsdbTransaction(params, socket)
    if (jsonObjects === undefined) {
      socket.destroy()
      return
    }
    if (jsonObjects[0].error !== null) {
      log.error('Error while setting controller for network', {
        error: jsonObjects[0].error,
        host: this.host.name_label,
        network: network.name_label,
      })
    } else {
      log.info('Controller set for network', {
        controller: this._controllerUuid,
        host: this.host.name_label,
        network: network.name_label,
      })
    }

    socket.destroy()
  }

  async getOfPortForVif(vif) {
    const where = [['external_ids', 'includes', toMap({ 'xs-vif-uuid': vif.uuid })]]
    const socket = await this._connect()
    const selectResult = await this._select(
      'Interface',
      ['name', 'ofport'],
      where,
      socket,
      true // multiResult
    )
    if (selectResult === undefined) {
      log.error('No of port found for VIF', {
        network: vif.$network.name_label,
        host: this.host.name_label,
        vm: vif.$VM.name_label,
        vif: vif.uuid,
      })
      return
    }

    let ofport
    for (const i in selectResult) {
      const row = selectResult[i]
      if (!row.name.includes('tap')) {
        ofport = row.ofport
        break
      }
    }

    socket.destroy()
    return ofport
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

  async _removePortsFromBridge(bridge, portsToDelete, socket) {
    const mutateBridgeOperation = {
      op: 'mutate',
      table: 'Bridge',
      where: [['_uuid', '==', ['uuid', bridge.uuid]]],
      mutations: [['ports', 'delete', portsToDelete]],
    }

    const params = ['Open_vSwitch', mutateBridgeOperation]
    const jsonObjects = await this._sendOvsdbTransaction(params, socket)
    if (jsonObjects === undefined) {
      throw Error('Undefined OVSDB result while deleting ports from bridge', {
        bridge: bridge.name,
        host: this.host.name_label,
        portsToDelete,
      })
    }
    if (jsonObjects[0].error != null) {
      throw Error('Error while deleting ports from bridge', {
        error: jsonObjects[0].error,
        bridge: bridge.name,
        host: this.host.name_label,
        portsToDelete,
      })
    }

    log.debug('Ports deleted from bridge', {
      nPorts: jsonObjects[0].result[0].count,
      bridge: bridge.name,
      host: this.host.name_label,
    })
  }

  // ---------------------------------------------------------------------------

  async _bridgeAlreadyControlled(bridge, socket) {
    const where = [['_uuid', '==', ['uuid', bridge.uuid]]]
    let result = await this._select('Bridge', ['controller'], where, socket)
    const controllers = setFromSelect(result.controller)
    for (const controller of controllers) {
      const where = [['_uuid', '==', controller]]
      result = await this._select('Controller', ['target'], where, socket)
      if (result.target === TARGET) {
        return true
      }
    }

    return false
  }

  // ---------------------------------------------------------------------------

  async _getBridgeForNetwork(network, socket) {
    const where = [['external_ids', 'includes', toMap({ 'xs-network-uuids': network.uuid })]]
    const selectResult = await this._select('Bridge', ['_uuid', 'name'], where, socket)
    if (selectResult === undefined) {
      log.error('No bridge found for network', {
        network: network.name_label,
        host: this.host.name_label,
      })
      return {}
    }

    return { uuid: selectResult._uuid[1], name: selectResult.name }
  }

  async _interfaceAndPortAlreadyExist(bridge, remoteAddress, socket) {
    const ports = await this._getBridgePorts(bridge, socket)
    if (ports === undefined) {
      return
    }

    for (const port of ports) {
      const portUuid = port[1]
      const interfaces = await this._getPortInterfaces(portUuid, socket)
      if (interfaces === undefined) {
        continue
      }

      for (const iface of interfaces) {
        const interfaceUuid = iface[1]
        const hasRemote = await this._interfaceHasRemote(interfaceUuid, remoteAddress, socket)
        if (hasRemote) {
          return port
        }
      }
    }
  }

  async _getBridgePorts(bridge, socket) {
    const where = [['_uuid', '==', ['uuid', bridge.uuid]]]
    const selectResult = await this._select('Bridge', ['ports'], where, socket)
    if (selectResult === undefined) {
      return
    }

    return setFromSelect(selectResult.ports)
  }

  async _getPortInterfaces(portUuid, socket) {
    const where = [['_uuid', '==', ['uuid', portUuid]]]
    const selectResult = await this._select('Port', ['name', 'interfaces'], where, socket)
    if (selectResult === undefined) {
      return
    }

    return setFromSelect(selectResult.interfaces)
  }

  async _interfaceHasRemote(interfaceUuid, remoteAddress, socket) {
    const where = [['_uuid', '==', ['uuid', interfaceUuid]]]
    const selectResult = await this._select('Interface', ['name', 'options'], where, socket)
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

  async _select(table, columns, where, socket, multiResult = false) {
    const selectOperation = {
      op: 'select',
      table,
      columns,
      where,
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

    if (multiResult) {
      return jsonResult.rows
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
      params,
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
        result = await fromEvent(stream, 'data')
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

  _connect() {
    return this._tlsHelper.connect(this.host.address, OVSDB_PORT)
  }
}
