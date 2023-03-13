import assert from 'assert'
import NodeOpenssl from 'node-openssl-cert'
import { access, constants, readFile, writeFile } from 'fs'
import { createLogger } from '@xen-orchestra/log'
import { EventEmitter } from 'events'
import { filter, find, forOwn, map, omitBy } from 'lodash'
import { fromCallback, promisify } from 'promise-toolbox'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

import { OpenFlowChannel } from './protocol/openflow-channel'
import { OvsdbClient } from './protocol/ovsdb-client'
import { PrivateNetwork } from './private-network/private-network'
import { TlsHelper } from './utils/tls-helper'

// =============================================================================

const log = createLogger('xo:xo-server:sdn-controller')

const PROTOCOL = 'pssl'

const CA_CERT = 'ca-cert.pem'
const CLIENT_KEY = 'client-key.pem'
const CLIENT_CERT = 'client-cert.pem'

const SDN_CONTROLLER_CERT = 'sdn-controller-ca.pem'

const NB_DAYS = 9999

// =============================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    'cert-dir': {
      description: `Full path to a directory where to find: \`client-cert.pem\`,
 \`client-key.pem\` and \`ca-cert.pem\` to create ssl connections with hosts.
 If none is provided, the plugin will create its own self-signed certificates.`,

      type: 'string',
    },
    'override-certs': {
      description: `Replace already existing SDN controller CA certificate`,

      type: 'boolean',
      default: false,
    },
  },
}

// =============================================================================

const noop = Function.prototype

// -----------------------------------------------------------------------------

const fileWrite = promisify(writeFile)
const fileRead = promisify(readFile)
async function fileExists(path) {
  try {
    await fromCallback(access, path, constants.F_OK)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false
    }

    throw error
  }

  return true
}

// -----------------------------------------------------------------------------

// 2019-09-03
// Compatibility code, to be removed in 1 year.
const updateNetworkOtherConfig = network =>
  Promise.all(
    map(
      {
        'cross-pool-network-uuid': 'cross_pool_network_uuid',
        encapsulation: 'encapsulation',
        'pif-device': 'pif_device',
        'private-pool-wide': 'private_pool_wide',
        vni: 'vni',
      },
      (oldKey, newKey) => {
        const namespacedKey = `xo:sdn-controller:${newKey}`
        if (network.other_config[namespacedKey] !== undefined) {
          // Nothing to do the update has been done already
          return
        }

        const value = network.other_config[oldKey]
        if (value !== undefined) {
          return network.update_other_config({
            [oldKey]: null,
            [namespacedKey]: value,
          })
        }
      }
    )
  )

// -----------------------------------------------------------------------------

// 2019-10-01
// Transform already existing private networks in the new form
// To be removed in 1 year
function updateOldPrivateNetwork(network) {
  log.info('Update old network', { network: network.name_label })
  const uuid =
    network.other_config['xo:sdn-controller:cross-pool-network-uuid'] !== undefined
      ? network.other_config['xo:sdn-controller:cross-pool-network-uuid']
      : uuidv4()

  return network.update_other_config({
    'xo:sdn-controller:private-pool-wide': null,
    'xo:sdn-controller:cross-pool-network-uuid': null,
    'xo:sdn-controller:private-network-uuid': uuid,
  })
}

// -----------------------------------------------------------------------------

async function generateCertificatesAndKey(dataDir) {
  const openssl = new NodeOpenssl()
  const rsaKeyOptions = {
    rsa_keygen_bits: 4096,
    format: 'PKCS8',
  }
  const subject = {
    countryName: 'XX',
    localityName: 'Default City',
    organizationName: 'Default Company LTD',
  }
  const csrOptions = {
    hash: 'sha256',
    startdate: new Date('1984-02-04 00:00:00'),
    enddate: new Date('2143-06-04 04:16:23'),
    subject,
  }
  const caCsrOptions = {
    hash: 'sha256',
    days: NB_DAYS,
    subject,
  }

  let operation
  try {
    // CA Cert
    operation = 'Generating CA private key'
    const caKey = await fromCallback.call(openssl, 'generateRSAPrivateKey', rsaKeyOptions)

    operation = 'Generating CA certificate'
    const caCsr = await fromCallback.call(openssl, 'generateCSR', caCsrOptions, caKey, null)

    operation = 'Signing CA certificate'
    const caCrt = await fromCallback.call(openssl, 'selfSignCSR', caCsr, caCsrOptions, caKey, null)
    await fileWrite(join(dataDir, CA_CERT), caCrt)

    // Cert
    operation = 'Generating private key'
    const key = await fromCallback.call(openssl, 'generateRSAPrivateKey', rsaKeyOptions)
    await fileWrite(join(dataDir, CLIENT_KEY), key)

    operation = 'Generating certificate'
    const csr = await fromCallback.call(openssl, 'generateCSR', csrOptions, key, null)

    operation = 'Signing certificate'
    const crt = await fromCallback.call(openssl, 'CASignCSR', csr, caCsrOptions, false, caCrt, caKey, null)
    await fileWrite(join(dataDir, CLIENT_CERT), crt)
  } catch (error) {
    log.error('Error while generating certificates and keys', {
      operation,
      error,
    })
    throw error
  }

  log.debug('All certificates have been successfully written')
}

// -----------------------------------------------------------------------------

async function createTunnel(host, network) {
  const otherConfig = network.other_config
  const pifDevice = otherConfig['xo:sdn-controller:pif-device']
  const pifVlan = otherConfig['xo:sdn-controller:vlan']
  const hostPif = host.$PIFs.find(
    pif => pif.device === pifDevice && pif.VLAN === +pifVlan && pif.ip_configuration_mode !== 'None'
  )
  if (hostPif === undefined) {
    log.error("Can't create tunnel: no available PIF", {
      pifDevice,
      pifVlan,
      network: network.name_label,
      host: host.name_label,
      pool: host.$pool.name_label,
    })
    return
  }

  const encapsulation = otherConfig['xo:sdn-controller:encapsulation'] ?? 'gre'
  try {
    let tunnelRef
    try {
      tunnelRef = await host.$xapi.call('tunnel.create', hostPif.$ref, network.$ref, encapsulation)
    } catch (error) {
      if (error.code === 'MESSAGE_PARAMETER_COUNT_MISMATCH') {
        // Before 8.2, protocol field did not exist, let's try without it!
        tunnelRef = await host.$xapi.call('tunnel.create', hostPif.$ref, network.$ref)
      } else {
        throw error
      }
    }
    const tunnel = await host.$xapi._getOrWaitObject(tunnelRef)
    await tunnel.$xapi._waitObjectState(tunnel.access_PIF, pif => pif.currently_attached)
  } catch (error) {
    log.error('Error while creating tunnel', {
      error,
      pifDevice,
      pifVlan,
      network: network.name_label,
      host: host.name_label,
      pool: host.$pool.name_label,
    })
    return
  }

  log.debug('New tunnel added', {
    pifDevice,
    pifVlan,
    network: network.name_label,
    host: host.name_label,
    pool: host.$pool.name_label,
  })
}

function getHostTunnelForNetwork(host, networkRef) {
  const pif = host.$PIFs.find(_ => _.network === networkRef)
  if (pif === undefined) {
    return
  }

  const tunnel = find(host.$xapi.objects.all, {
    $type: 'tunnel',
    access_PIF: pif.$ref,
  })

  return tunnel
}

// -----------------------------------------------------------------------------

function isControllerNeeded(xapi) {
  const controller = find(xapi.objects.all, { $type: 'SDN_controller' })
  return !(controller?.protocol === PROTOCOL && controller.address === '' && controller.port === 0)
}

// =============================================================================

class SDNController extends EventEmitter {
  /*
  Attributes on created networks:
  - `other_config`:
    - `xo:sdn-controller:encapsulation`       : encapsulation protocol used for tunneling (either `gre` or `vxlan`)
    - `xo:sdn-controller:encrypted`           : `true` if the network is encrypted
    - `xo:sdn-controller:pif-device`          : PIF device on which the tunnels are created, must be physical or VLAN or bond master and have an IP configuration
    - `xo:sdn-controller:preferred-center`    : The host UUID to prioritize as network center (or not defined)
    - `xo:sdn-controller:private-network-uuid`: UUID of the private network, same across pools
    - `xo:sdn-controller:vlan`                : VLAN of the PIFs on which the network is created
    - `xo:sdn-controller:vni`                 : VxLAN Network Identifier,
        it is used by OpenVSwitch to route traffic of different networks in a single tunnel
        See: https://tools.ietf.org/html/rfc7348

  Attributes on created tunnels: See: https://xapi-project.github.io/xapi/design/tunnelling.html
  - `status`:
    - `active`: `true` if the corresponding OpenVSwitch bridge is correctly configured and working
    - `key`   : Corresponding OpenVSwitch bridge name (missing if `active` is `false`)

  Attributes on VIFs (OpenFlow entries):
  - `other_config`:
    - `xo:sdn-controller:of-rules`: A list of openflow entries to aply to this VIF
  */

  constructor({ xo, getDataDir }) {
    super()

    this._xo = xo
    this._getDataDir = getDataDir

    this._newHosts = []
    this.privateNetworks = {}

    this._networks = new Map()
    this._starCenters = new Map()

    this._cleaners = []
    this._objectsAdded = this._objectsAdded.bind(this)
    this._objectsUpdated = this._objectsUpdated.bind(this)

    this._overrideCerts = false

    this._prevVni = 0

    this.ovsdbClients = {}
    this.ofChannels = {}

    this._tlsHelper = new TlsHelper()

    this._handledTasks = []
    this._managed = []
  }

  // ---------------------------------------------------------------------------

  async configure(configuration) {
    this._overrideCerts = configuration['override-certs']
    let certDirectory = configuration['cert-dir']

    if (certDirectory === undefined) {
      log.debug(`No cert-dir provided, using default self-signed certificates`)
      certDirectory = await this._getDataDir()

      if (!(await fileExists(join(certDirectory, CA_CERT)))) {
        // If one certificate doesn't exist, none should
        assert(!(await fileExists(join(certDirectory, CLIENT_KEY))), `${CLIENT_KEY} should not exist`)
        assert(!(await fileExists(join(certDirectory, CLIENT_CERT))), `${CLIENT_CERT} should not exist`)

        log.debug(`No default self-signed certificates exists, creating them`)
        await generateCertificatesAndKey(certDirectory)
      }
    }
    // TODO: verify certificates and create new certificates if needed

    ;[this._clientKey, this._clientCert, this._caCert] = await Promise.all([
      fileRead(join(certDirectory, CLIENT_KEY)),
      fileRead(join(certDirectory, CLIENT_CERT)),
      fileRead(join(certDirectory, CA_CERT)),
    ])
    this._tlsHelper.updateCertificates(this._clientKey, this._clientCert, this._caCert)
    const updatedPools = []
    await Promise.all(
      map(this.privateNetworks, async privateNetworks => {
        await Promise.all(
          privateNetworks.getPools().map(async pool => {
            if (!updatedPools.includes(pool)) {
              const xapi = this._xo.getXapi(pool)
              await this._installCaCertificateIfNeeded(xapi)
              updatedPools.push(pool)
            }
          })
        )
      })
    )
  }

  async load() {
    // ---------------- Private Network method ---------------------------------

    const createPrivateNetwork = params =>
      this._createPrivateNetwork({
        encrypted: false,
        mtu: 0,
        ...params,
        vni: ++this._prevVni,
      })

    createPrivateNetwork.description = 'Creates a pool-wide private network on a selected pool'
    createPrivateNetwork.params = {
      poolIds: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      pifIds: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      name: { type: 'string' },
      description: { type: 'string', minLength: 0 },
      encapsulation: { type: 'string' },
      encrypted: { type: 'boolean', optional: true },
      mtu: { type: 'integer', optional: true },
      preferredCenterId: { type: 'string', optional: true },
    }
    createPrivateNetwork.permission = 'admin'

    // ---------------- OpenFlow rules method ----------------------------------

    const addRule = params => this._addRule(params)
    addRule.description = 'Add an ACL rule to a VIF'
    addRule.params = {
      allow: { type: 'boolean' },
      direction: { type: 'string' },
      ipRange: { type: 'string', optional: true },
      port: { type: 'integer', optional: true },
      protocol: { type: 'string', optional: true },
      vifId: { type: 'string' },
    }
    addRule.permission = 'admin'

    const deleteRule = params => this._deleteRule(params)
    deleteRule.description = 'Delete an ACL rule from a VIF'
    deleteRule.params = {
      direction: { type: 'string' },
      ipRange: { type: 'string', optional: true },
      port: { type: 'integer', optional: true },
      protocol: { type: 'string', optional: true },
      vifId: { type: 'string' },
    }
    deleteRule.permission = 'admin'

    // -------------------------------------------------------------------------

    this._unsetApiMethods = this._xo.addApiMethods({
      sdnController: {
        createPrivateNetwork,

        addRule,
        deleteRule,
      },
    })

    forOwn(this._xo.getAllXapis(), xapi => {
      if (xapi.status === 'connected') {
        this._handleConnectedXapi(xapi)
      }
    })

    const handleConnectedServer = ({ xapi }) => this._handleConnectedXapi(xapi)
    const handleDisconnectedServer = ({ xapi }) => this._handleDisconnectedXapi(xapi)
    this._xo.on('server:connected', handleConnectedServer)
    this._xo.on('server:disconnected', handleDisconnectedServer)
    this._cleaners.push(() => {
      this._xo.removeListener('server:connected', handleConnectedServer)
      this._xo.removeListener('server:disconnected', handleDisconnectedServer)
    })
  }

  async unload() {
    this.privateNetworks = {}
    this._newHosts = []

    this._networks.clear()
    this._starCenters.clear()

    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners = []

    this.ovsdbClients = {}
    this.ofChannels = {}

    this._handledTasks = []
    this._managed = []

    this._unsetApiMethods()
  }

  // ---------------------------------------------------------------------------

  registerPrivateNetwork(privateNetwork) {
    this.privateNetworks[privateNetwork.uuid] = privateNetwork
    log.info('Private network registered', {
      privateNetwork: privateNetwork.uuid,
    })
  }

  // ===========================================================================

  async _handleConnectedXapi(xapi) {
    log.debug('xapi connected', { id: xapi.pool.uuid })
    try {
      await xapi.objectsFetched

      if (isControllerNeeded(xapi)) {
        return
      }

      this._cleaners.push(await this._manageXapi(xapi))
      const hosts = filter(xapi.objects.all, { $type: 'host' })
      for (const host of hosts) {
        this._getOrCreateOvsdbClient(host)
        this._getOrCreateOfChannel(host)
      }

      // Add already existing private networks
      const networks = filter(xapi.objects.all, { $type: 'network' })
      const noVniNetworks = []
      await Promise.all(
        networks.map(async network => {
          // 2019-09-03
          // Compatibility code, to be removed in 1 year.
          await updateNetworkOtherConfig(network)
          network = await network.$xapi.barrier(network.$ref)
          let otherConfig = network.other_config

          // 2019-10-01
          // To be removed in a year
          if (otherConfig['xo:sdn-controller:private-pool-wide'] === 'true') {
            await updateOldPrivateNetwork(network)
          }
          network = await network.$xapi.barrier(network.$ref)
          otherConfig = network.other_config

          const uuid = otherConfig['xo:sdn-controller:private-network-uuid']
          if (uuid === undefined) {
            return
          }

          let privateNetwork = this.privateNetworks[uuid]
          if (privateNetwork === undefined) {
            const preferredCenterUuid = otherConfig['xo:sdn-controller:preferred-center']
            const preferredCenter =
              preferredCenterUuid !== undefined
                ? this._xo.getXapiObject(this._xo.getObject(preferredCenterUuid, 'host'))
                : undefined
            privateNetwork = new PrivateNetwork(this, uuid, preferredCenter)
            this.privateNetworks[uuid] = privateNetwork
          }

          const vni = otherConfig['xo:sdn-controller:vni']
          if (vni === undefined) {
            noVniNetworks.push(network)
          } else {
            this._prevVni = Math.max(this._prevVni, +vni)
          }

          await privateNetwork.addNetwork(network)

          // Previously created network didn't store `pif-device`
          //
          // 2019-08-22
          // This is used to add the pif-device to networks created before this version. (v0.1.2)
          // This will be removed in 1 year.
          if (otherConfig['xo:sdn-controller:pif-device'] === undefined) {
            const tunnel = getHostTunnelForNetwork(privateNetwork.center, network.$ref)
            const pif = xapi.getObjectByRef(tunnel.transport_PIF)
            await network.update_other_config('xo:sdn-controller:pif-device', pif.device)
          }

          // Previously created network didn't store `vlan`
          //
          // 2020-01-27
          // This is used to add the `vlan` to networks created before this version. (v0.4.0)
          // This will be removed in 1 year.
          if (otherConfig['xo:sdn-controller:vlan'] === undefined) {
            const tunnel = getHostTunnelForNetwork(privateNetwork.center, network.$ref)
            const pif = xapi.getObjectByRef(tunnel.transport_PIF)
            await network.update_other_config('xo:sdn-controller:vlan', String(pif.VLAN))
          }

          this._networks.set(network.$id, network.$ref)
          if (privateNetwork.center !== undefined) {
            this._starCenters.set(privateNetwork.center.$id, privateNetwork.center.$ref)
          }
        })
      )

      // Add VNI to other config of networks without VNI
      //
      // 2019-08-22
      // This is used to add the VNI to networks created before this version. (v0.1.3)
      // This will be removed in 1 year.
      await Promise.all(
        noVniNetworks.map(async network => {
          await network.update_other_config('xo:sdn-controller:vni', String(++this._prevVni))

          // Re-elect a center to apply the VNI
          const privateNetwork = this.privateNetworks[network.other_config['xo:sdn-controller:private-network-uuid']]
          await this._electNewCenter(privateNetwork)
        })
      )

      // -----------------------------------------------------------------------

      const vifs = filter(xapi.objects.all, { $type: 'VIF' })
      for (const vif of vifs) {
        await this._applyVifOfRules(vif)
      }
    } catch (error) {
      log.error('Error while handling xapi connection', {
        id: xapi.pool.uuid,
        error,
      })
    }
  }

  _handleDisconnectedXapi(xapi) {
    log.debug('xapi disconnected', { id: xapi.pool.uuid })
    try {
      forOwn(this.privateNetworks, privateNetwork => {
        privateNetwork.networks = omitBy(privateNetwork.networks, network => network.$pool.uuid === xapi.pool.uuid)

        if (privateNetwork.center?.$pool.uuid === xapi.pool.uuid) {
          this._electNewCenter(privateNetwork)
        }
      })

      this.privateNetworks = filter(
        this.privateNetworks,
        privateNetwork => Object.keys(privateNetwork.networks).length !== 0
      )
    } catch (error) {
      log.error('Error while handling xapi disconnection', {
        id: xapi.pool.uuid,
        error,
      })
    }
  }

  // ===========================================================================

  async _addRule({ allow, direction, ipRange = '', port, protocol, vifId }) {
    const vif = this._xo.getXapiObject(this._xo.getObject(vifId, 'VIF'))
    try {
      assert(vif.currently_attached, 'VIF needs to be plugged to add rule')
      await this._setPoolControllerIfNeeded(vif.$pool)

      const client = this._getOrCreateOvsdbClient(vif.$VM.$resident_on)
      const channel = this._getOrCreateOfChannel(vif.$VM.$resident_on)
      const ofport = await client.getOfPortForVif(vif)
      await channel.addRule(vif, allow, protocol, port, ipRange, direction, ofport)
      const vifRules = vif.other_config['xo:sdn-controller:of-rules']
      const newVifRules = vifRules !== undefined ? JSON.parse(vifRules) : []
      const stringRule = JSON.stringify({
        allow,
        protocol,
        port,
        ipRange,
        direction,
      })
      if (!newVifRules.includes(stringRule)) {
        newVifRules.push(stringRule)
        await vif.update_other_config('xo:sdn-controller:of-rules', JSON.stringify(newVifRules))
      }
    } catch (error) {
      log.error('Error while adding OF rule', {
        error,
        vif: vif.uuid,
        host: vif.$VM.$resident_on.uuid,
        allow,
        protocol,
        port,
        ipRange,
        direction,
      })
    }
  }

  async _deleteRule({ direction, ipRange = '', port, protocol, vifId }, updateOtherConfig = true) {
    let vif = this._xo.getXapiObject(this._xo.getObject(vifId, 'VIF'))
    try {
      await this._setPoolControllerIfNeeded(vif.$pool)

      const client = this._getOrCreateOvsdbClient(vif.$VM.$resident_on)
      const channel = this._getOrCreateOfChannel(vif.$VM.$resident_on)
      const ofport = await client.getOfPortForVif(vif)
      await channel.deleteRule(vif, protocol, port, ipRange, direction, ofport)
      if (!updateOtherConfig) {
        return
      }

      const vifRules = vif.other_config['xo:sdn-controller:of-rules']
      if (vifRules === undefined) {
        // Nothing to do
        return
      }

      const newVifRules = JSON.parse(vifRules).filter(vifRule => {
        const rule = JSON.parse(vifRule)
        return (
          rule.protocol !== protocol || rule.port !== port || rule.ipRange !== ipRange || rule.direction !== direction
        )
      })

      await vif.update_other_config(
        'xo:sdn-controller:of-rules',
        Object.keys(newVifRules).length === 0 ? null : JSON.stringify(newVifRules)
      )

      vif = await vif.$xapi.barrier(vif.$ref)

      // Put back rules that could have been wrongfully deleted because delete rule too general
      await this._applyVifOfRules(vif)
    } catch (error) {
      log.error('Error while adding OF rule', {
        error,
        vif: vif.uuid,
        host: vif.$VM.$resident_on.uuid,
        protocol,
        port,
        ipRange,
        direction,
      })
    }
  }

  // ---------------------------------------------------------------------------

  async _createPrivateNetwork({
    poolIds,
    pifIds,
    name,
    description,
    encapsulation,
    vni,
    encrypted,
    mtu,
    preferredCenterId,
  }) {
    const pools = poolIds.map(id => this._xo.getXapiObject(id, 'pool'))

    let preferredCenter
    if (preferredCenterId !== undefined) {
      preferredCenter = this._xo.getXapiObject(this._xo.getObject(preferredCenterId, 'host'))

      // Put pool of preferred center first
      const preferredCenterPoolUuid = preferredCenter.$pool.uuid
      const i = pools.findIndex(pool => pool.uuid === preferredCenterPoolUuid)
      assert.notStrictEqual(i, -1)
      poolIds[i] = poolIds[0]
      poolIds[0] = preferredCenterPoolUuid
    }

    const privateNetwork = new PrivateNetwork(this, uuidv4(), preferredCenter)
    for (const pool of pools) {
      const pifId = pifIds.find(id => {
        const pif = this._xo.getXapiObject(this._xo.getObject(id, 'PIF'))
        return pif.$pool.$ref === pool.$ref
      })
      const pif = this._xo.getXapiObject(this._xo.getObject(pifId, 'PIF'))

      // Create the private network
      const createdNetworkRef = await pool.$xapi.call('network.create', {
        name_label: name,
        name_description: description,
        MTU: mtu,
        other_config: {
          // Set `automatic` to false so XenCenter does not get confused
          // See: https://citrix.github.io/xenserver-sdk/#network
          automatic: 'false',
          'xo:sdn-controller:encapsulation': encapsulation,
          'xo:sdn-controller:encrypted': encrypted ? 'true' : undefined,
          'xo:sdn-controller:pif-device': pif.device,
          'xo:sdn-controller:preferred-center': preferredCenter?.uuid,
          'xo:sdn-controller:private-network-uuid': privateNetwork.uuid,
          'xo:sdn-controller:vlan': String(pif.VLAN),
          'xo:sdn-controller:vni': String(vni),
        },
      })

      const createdNetwork = await pool.$xapi._getOrWaitObject(createdNetworkRef)

      log.info('New network created', {
        privateNetwork: privateNetwork.uuid,
        network: createdNetwork.name_label,
        pool: pool.name_label,
      })

      // For each pool's host, create a tunnel to the private network
      const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })
      await Promise.all(
        map(hosts, async host => {
          await createTunnel(host, createdNetwork)
          this._getOrCreateOvsdbClient(host)
          this._getOrCreateOfChannel(host)
        })
      )
      await this._setPoolControllerIfNeeded(pool)

      await privateNetwork.addNetwork(createdNetwork)
      this._networks.set(createdNetwork.$id, createdNetwork.$ref)
      if (privateNetwork.center !== undefined) {
        this._starCenters.set(privateNetwork.center.$id, privateNetwork.center.$ref)
      }
    }
  }

  // ---------------------------------------------------------------------------

  async _manageXapi(xapi) {
    if (this._managed.includes(xapi.pool.uuid)) {
      return noop // pushed in _cleaners
    }

    const { objects } = xapi

    const objectsRemovedXapi = this._objectsRemoved.bind(this, xapi)
    objects.on('add', this._objectsAdded)
    objects.on('update', this._objectsUpdated)
    objects.on('remove', objectsRemovedXapi)

    await this._installCaCertificateIfNeeded(xapi)
    this._managed.push(xapi.pool.uuid)

    return () => {
      objects.removeListener('add', this._objectsAdded)
      objects.removeListener('update', this._objectsUpdated)
      objects.removeListener('remove', objectsRemovedXapi)
    }
  }

  _objectsAdded(objects) {
    forOwn(objects, async object => {
      const { $type } = object

      if ($type === 'host') {
        log.debug('New host', {
          host: object.name_label,
          pool: object.$pool.name_label,
        })

        if (!this._newHosts.some(_ => _.$ref === object.$ref)) {
          this._newHosts.push(object)
        }
        this._getOrCreateOvsdbClient(object)
        this._getOrCreateOfChannel(object)
      } else if ($type === 'PIF') {
        log.debug('New PIF', {
          device: object.device,
          host: object.$host.name_label,
          network: object.$network.name_label,
          pool: object.$pool.name_label,
        })

        const client = this.ovsdbClients[object.host]
        client.setBridgeControllerForNetwork(object.$network)
      }
    })
  }

  _objectsUpdated(objects) {
    forOwn(objects, async object => {
      try {
        const { $type } = object
        if ($type === 'PIF') {
          await this._pifUpdated(object)
        } else if ($type === 'host') {
          await this._hostUpdated(object)
        } else if ($type === 'host_metrics') {
          await this._hostMetricsUpdated(object)
        } else if ($type === 'VM') {
          await this._vmUpdated(object)
        } else if ($type === 'VIF') {
          await this._vifUpdated(object)
        }
      } catch (error) {
        log.error('Error in _objectsUpdated', {
          error,
          object,
        })
      }
    })
  }

  _objectsRemoved(xapi, objects) {
    forOwn(objects, async (object, id) => {
      try {
        this.ovsdbClients = omitBy(this.ovsdbClients, client => client.host.$id === id)
        this.ofChannels = omitBy(this.ofChannels, channel => channel.host.$id === id)

        // If a Star center host is removed: re-elect a new center where needed
        const starCenterRef = this._starCenters.get(id)
        if (starCenterRef !== undefined) {
          this._starCenters.delete(id)
          const privateNetworks = filter(
            this.privateNetworks,
            privateNetwork => privateNetwork.center?.$ref === starCenterRef
          )
          for (const privateNetwork of privateNetworks) {
            await this._electNewCenter(privateNetwork)
          }
          return
        }

        // If a network is removed, clean this.privateNetworks from it
        const networkRef = this._networks.get(id)
        if (networkRef !== undefined) {
          this._networks.delete(id)
          forOwn(this.privateNetworks, privateNetwork => {
            privateNetwork.networks = omitBy(privateNetwork.networks, network => network.$ref === networkRef)
          })

          this.privateNetworks = filter(
            this.privateNetworks,
            privateNetwork => Object.keys(privateNetwork.networks).length !== 0
          )
        }
      } catch (error) {
        log.error('Error in _objectsRemoved', {
          error,
          object,
        })
      }
    })
  }

  async _pifUpdated(pif) {
    // Only if PIF is in a private network
    const privateNetwork = find(
      this.privateNetworks,
      privateNetwork => privateNetwork.networks[pif.$pool.uuid]?.$ref === pif.network
    )
    if (privateNetwork === undefined) {
      return
    }

    if (!pif.currently_attached) {
      const tunnel = getHostTunnelForNetwork(pif.$host, pif.network)
      await tunnel.set_status({ active: 'false' })
      if (privateNetwork.center.$ref !== pif.host) {
        return
      }

      log.debug('PIF of star-center host has been unplugged, electing a new star-center', {
        pif: pif.device,
        network: pif.$network.name_label,
        host: pif.$host.name_label,
        pool: pif.$pool.name_label,
      })
      await this._electNewCenter(privateNetwork)
    } else {
      if (privateNetwork.center === undefined) {
        const host = pif.$host
        log.debug('First available host becomes star center of network', {
          host: host.name_label,
          network: pif.$network.name_label,
          pool: pif.$pool.name_label,
        })
        privateNetwork.center = host
        this._starCenters.set(host.$id, host.$ref)
      }

      log.debug('PIF plugged', {
        pif: pif.device,
        network: pif.$network.name_label,
        host: pif.$host.name_label,
        pool: pif.$pool.name_label,
      })

      await this._addHostToPrivateNetwork(pif.$host, pif.$network)
    }
  }

  async _hostUpdated(host) {
    let i
    if (!host.enabled || host.PIFs.length === 0 || (i = this._newHosts.findIndex(_ => _.$ref === host.$ref)) === -1) {
      return
    }

    this._newHosts.splice(i, 1)

    log.debug('Sync pool certificates', {
      newHost: host.name_label,
      pool: host.$pool.name_label,
    })
    try {
      await host.$xapi.call('pool.certificate_sync')
    } catch (error) {
      log.error('Error while syncing SDN controller CA certificate', {
        error,
        pool: host.$pool.name_label,
      })
    }

    this._setBridgeControllerForHost(host)

    const privateNetworks = filter(
      this.privateNetworks,
      privateNetwork => privateNetwork[host.$pool.uuid] !== undefined
    )
    for (const privateNetwork of privateNetworks) {
      const network = privateNetwork.networks[host.$pool.uuid]
      const tunnel = getHostTunnelForNetwork(host, network.$ref)
      if (tunnel !== undefined) {
        continue
      }

      await createTunnel(host, network)
    }

    await this._addHostToPrivateNetworks(host)
  }

  _hostMetricsUpdated(hostMetrics) {
    const ovsdbClient = find(this.ovsdbClients, client => client.host.metrics === hostMetrics.$ref)

    if (hostMetrics.live) {
      return this._addHostToPrivateNetworks(ovsdbClient.host)
    }

    return this._hostUnreachable(ovsdbClient.host)
  }

  async _vmUpdated(vm) {
    forOwn(vm.current_operations, async (value, key) => {
      if (this._handledTasks.includes(key)) {
        return
      }

      this._handledTasks.push(key)
      // Clean before task ends
      if (
        value === 'migrate_send' ||
        value === 'pool_migrate' ||
        value === 'clean_reboot' ||
        value === 'hard_reboot' ||
        value === 'hard_shutdown' ||
        value === 'clean_shutdown'
      ) {
        await this._cleanOfRules(vm)
      }

      await vm.$xapi.watchTask(key).catch(noop)
      // Re-apply rules after task ended
      if (
        value === 'migrate_send' ||
        value === 'pool_migrate' ||
        value === 'clean_reboot' ||
        value === 'hard_reboot' ||
        value === 'start' ||
        value === 'start_on'
      ) {
        vm = await vm.$xapi.barrier(vm.$ref)
        await this._applyOfRules(vm)
      }

      this._handledTasks = filter(this._handledTasks, ref => ref !== key)
    })
  }

  async _vifUpdated(vif) {
    await Promise.all(
      map(vif.current_operations, async (value, key) => {
        if (this._handledTasks.includes(key)) {
          return
        }

        this._handledTasks.push(key)
        if (value === 'plug') {
          await vif.$xapi.watchTask(key).catch(noop)
          vif = await vif.$xapi.barrier(vif.$ref)
          await this._applyVifOfRules(vif)
        } else if (value === 'unplug' || value === 'unplug_force') {
          await this._cleanVifOfRules(vif)
          await vif.$xapi.watchTask(key).catch(noop)
        }
        this._handledTasks = filter(this._handledTasks, ref => ref !== key)
      })
    )
  }

  // ---------------------------------------------------------------------------

  async _setPoolControllerIfNeeded(pool) {
    if (isControllerNeeded(pool.$xapi)) {
      const controller = find(pool.$xapi.objects.all, {
        $type: 'SDN_controller',
      })
      if (controller !== undefined) {
        await pool.$xapi.call('SDN_controller.forget', controller.$ref)
        log.debug('Old SDN controller removed', {
          pool: pool.name_label,
        })
      }

      await pool.$xapi.call('SDN_controller.introduce', PROTOCOL)
      log.debug('SDN controller has been set', {
        pool: pool.name_label,
      })
    }

    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })
    await Promise.all(
      hosts.map(host => {
        return this._setBridgeControllerForHost(host)
      })
    )
    this._cleaners.push(await this._manageXapi(pool.$xapi))
  }

  _setBridgeControllerForHost(host) {
    const client = this.ovsdbClients[host.$ref]
    return client.setBridgeController()
  }

  // ---------------------------------------------------------------------------

  async _installCaCertificateIfNeeded(xapi) {
    let needInstall = false
    try {
      const result = await xapi.call('pool.certificate_list')
      if (!result.includes(SDN_CONTROLLER_CERT)) {
        needInstall = true
      } else if (this._overrideCerts) {
        await xapi.call('pool.certificate_uninstall', SDN_CONTROLLER_CERT)
        log.debug('Old SDN controller CA certificate uninstalled', {
          pool: xapi.pool.name_label,
        })
        needInstall = true
      }
    } catch (error) {
      log.error('Error while retrieving certificate list', {
        error,
        pool: xapi.pool.name_label,
      })
    }
    if (!needInstall) {
      return
    }

    try {
      await xapi.call('pool.certificate_install', SDN_CONTROLLER_CERT, this._caCert.toString())
      await xapi.call('pool.certificate_sync')
      log.debug('SDN controller CA certficate installed', {
        pool: xapi.pool.name_label,
      })
    } catch (error) {
      log.error('Error while installing SDN controller CA certificate', {
        error,
        pool: xapi.pool.name_label,
      })
    }
  }

  // ---------------------------------------------------------------------------

  async _addHostToPrivateNetwork(host, network) {
    const tunnel = getHostTunnelForNetwork(host, network.$ref)
    if (tunnel === undefined) {
      log.info('Unable to add host to network: no tunnel available', {
        network: network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })
      return
    }

    const privateNetwork = find(
      this.privateNetworks,
      privateNetwork => privateNetwork.networks[host.$pool.uuid]?.$ref === network.$ref
    )
    if (privateNetwork === undefined) {
      // TODO: log error?
      return
    }

    const centerNetwork = privateNetwork.networks[privateNetwork.center.$pool.uuid]
    const starCenterTunnel = getHostTunnelForNetwork(privateNetwork.center, centerNetwork.$ref)
    await tunnel.set_status({ active: 'false' })

    const bridgeName = await privateNetwork.addHost(host)
    if (bridgeName !== undefined) {
      const activeStatus = { active: 'true', key: bridgeName }
      await Promise.all([tunnel.set_status(activeStatus), starCenterTunnel.set_status(activeStatus)])
    }
  }

  async _addHostToPrivateNetworks(host) {
    const xapi = host.$xapi

    const tunnels = filter(xapi.objects.all, { $type: 'tunnel' })
    for (const tunnel of tunnels) {
      const accessPif = xapi.getObjectByRef(tunnel.access_PIF)
      if (accessPif.host !== host.$ref) {
        continue
      }

      const network = accessPif.$network

      if (!accessPif.currently_attached) {
        try {
          await xapi.call('PIF.plug', accessPif.$ref)
        } catch (error) {
          log.error('Error while plugging PIF', {
            error,
            pif: accessPif.device,
            network: network.name_label,
            host: host.name_label,
            pool: host.$pool.name_label,
          })
          continue
        }

        log.debug('PIF plugged', {
          pif: accessPif.device,
          network: network.name_label,
          host: host.name_label,
          pool: host.$pool.name_label,
        })
      }

      await this._addHostToPrivateNetwork(host, network)
    }
  }

  async _electNewCenter(privateNetwork) {
    await privateNetwork.electNewCenter()
    if (privateNetwork.center !== undefined) {
      this._starCenters.set(privateNetwork.center.$id, privateNetwork.center.$ref)
    }
  }

  async _hostUnreachable(host) {
    let privateNetworks = filter(this.privateNetworks, privateNetwork => {
      return privateNetwork.center.$ref === host.$ref
    })
    for (const privateNetwork of privateNetworks) {
      log.debug('Unreachable star-center, electing a new one', {
        privateNetwork: privateNetwork.uuid,
        center: host.name_label,
        pool: host.$pool.name_label,
      })

      await this._electNewCenter(privateNetwork)
    }

    privateNetworks = filter(this.privateNetworks, privateNetwork => privateNetwork[host.$pool.uuid] !== undefined)
    await Promise.all(
      map(privateNetworks, privateNetwork => {
        const tunnel = getHostTunnelForNetwork(host, privateNetwork[host.$pool.uuid])
        if (tunnel !== undefined) {
          return tunnel.set_status({ active: 'false' })
        }
      })
    )
  }

  // ---------------------------------------------------------------------------

  async _applyVifOfRules(vif) {
    if (!vif.currently_attached) {
      return
    }

    const vifRules = vif.other_config['xo:sdn-controller:of-rules']
    const parsedRules = vifRules !== undefined ? JSON.parse(vifRules) : []
    for (const stringRule of parsedRules) {
      const rule = JSON.parse(stringRule)
      await this._addRule({ ...rule, vifId: vif.$id })
    }
  }

  async _cleanVifOfRules(vif) {
    const vifRules = vif.other_config['xo:sdn-controller:of-rules']
    const parsedRules = vifRules !== undefined ? JSON.parse(vifRules) : []
    for (const stringRule of parsedRules) {
      const rule = JSON.parse(stringRule)
      await this._deleteRule({ ...rule, vifId: vif.$id }, false)
    }
  }

  async _cleanOfRules(vm) {
    for (const vif of vm.$VIFs) {
      await this._cleanVifOfRules(vif)
    }
  }

  async _applyOfRules(vm) {
    for (const vif of vm.$VIFs) {
      await this._applyVifOfRules(vif)
    }
  }

  // ---------------------------------------------------------------------------

  _getOrCreateOvsdbClient(host) {
    let client = this.ovsdbClients[host.$ref]
    if (client === undefined) {
      client = new OvsdbClient(host, this._tlsHelper)
      this.ovsdbClients[host.$ref] = client
    }

    return client
  }

  _getOrCreateOfChannel(host) {
    let channel = this.ofChannels[host.$ref]
    if (channel === undefined) {
      channel = new OpenFlowChannel(host, this._tlsHelper)
      this.ofChannels[host.$ref] = channel
    }

    return channel
  }
}

// =============================================================================

export default opts => new SDNController(opts)
