import assert from 'assert'
import ipaddr from 'ipaddr.js'
import semver from 'semver'
import { createLogger } from '@xen-orchestra/log'
import { find, flatten, forEach, groupBy, isEmpty, keyBy, mapValues, omit, trimEnd, zipObject } from 'lodash'

const log = createLogger('xo:netbox')

const CLUSTER_TYPE = 'XCP-ng Pool'
const CHUNK_SIZE = 100
const NAME_MAX_LENGTH = 64
const REQUEST_TIMEOUT = 120e3 // 2min
const M = 1024 ** 2
const G = 1024 ** 3

const { push } = Array.prototype

const diff = (newer, older) => {
  if (typeof newer !== 'object') {
    return newer === older ? undefined : newer
  }

  newer = { ...newer }
  Object.keys(newer).forEach(key => {
    if (diff(newer[key], older[key]) === undefined) {
      delete newer[key]
    }
  })

  return isEmpty(newer) ? undefined : newer
}

const indexName = (name, index) => {
  const suffix = ` (${index})`
  return name.slice(0, NAME_MAX_LENGTH - suffix.length) + suffix
}

class Netbox {
  #allowUnauthorized
  #endpoint
  #intervalToken
  #loaded
  #netboxApiVersion
  #pools
  #removeApiMethods
  #syncInterval
  #token
  #xo

  constructor({ xo }) {
    this.#xo = xo
  }

  configure(configuration) {
    this.#endpoint = trimEnd(configuration.endpoint, '/')
    if (!/^https?:\/\//.test(this.#endpoint)) {
      this.#endpoint = 'http://' + this.#endpoint
    }
    this.#allowUnauthorized = configuration.allowUnauthorized ?? false
    this.#token = configuration.token
    this.#pools = configuration.pools
    this.#syncInterval = configuration.syncInterval && configuration.syncInterval * 60 * 60 * 1e3

    // We don't want to start the auto-sync if the plugin isn't loaded
    if (this.#loaded) {
      clearInterval(this.#intervalToken)
      if (this.#syncInterval !== undefined) {
        this.#intervalToken = setInterval(this.#synchronize.bind(this), this.#syncInterval)
      }
    }
  }

  load() {
    const synchronize = ({ pools }) => this.#synchronize(pools)
    synchronize.description = 'Synchronize XO pools with Netbox'
    synchronize.params = {
      pools: { type: 'array', optional: true, items: { type: 'string' } },
    }

    this.#removeApiMethods = this.#xo.addApiMethods({
      netbox: { synchronize },
    })

    if (this.#syncInterval !== undefined) {
      this.#intervalToken = setInterval(this.#synchronize.bind(this), this.#syncInterval)
    }

    this.#loaded = true
  }

  unload() {
    this.#removeApiMethods()
    clearInterval(this.#intervalToken)

    this.#loaded = false
  }

  async #makeRequest(path, method, data) {
    const dataDebug =
      Array.isArray(data) && data.length > 2 ? [...data.slice(0, 2), `and ${data.length - 2} others`] : data
    log.debug(`${method} ${path}`, dataDebug)
    let url = this.#endpoint + '/api' + path
    const options = {
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${this.#token}` },
      method,
      rejectUnauthorized: !this.#allowUnauthorized,
      timeout: REQUEST_TIMEOUT,
    }

    const httpRequest = async () => {
      try {
        const response = await this.#xo.httpRequest(url, options)
        this.#netboxApiVersion = response.headers['api-version']
        const body = await response.text()
        if (body.length > 0) {
          return JSON.parse(body)
        }
      } catch (error) {
        error.data = {
          method,
          path,
          body: dataDebug,
        }
        try {
          const body = await error.response.text()
          if (body.length > 0) {
            error.data.error = JSON.parse(body)
          }
        } catch {
          throw error
        }
        throw error
      }
    }

    let response = []
    // Split long POST request into chunks of CHUNK_SIZE objects to avoid a Bad Gateway errors
    if (Array.isArray(data)) {
      let offset = 0
      while (offset < data.length) {
        options.body = JSON.stringify(data.slice(offset, offset + CHUNK_SIZE))
        push.apply(response, await httpRequest())
        offset += CHUNK_SIZE
      }
    } else {
      if (data !== undefined) {
        options.body = JSON.stringify(data)
      }
      response = await httpRequest()
    }

    if (method !== 'GET') {
      return response
    }

    // Handle pagination for GET requests
    const { results } = response
    while (response.next !== null) {
      const { pathname, search } = new URL(response.next)
      url = this.#endpoint + pathname + search
      response = await httpRequest()
      push.apply(results, response.results)
    }

    return results
  }

  async #checkCustomFields() {
    const customFields = await this.#makeRequest('/extras/custom-fields/', 'GET')
    const uuidCustomField = customFields.find(field => field.name === 'uuid')
    if (uuidCustomField === undefined) {
      throw new Error('UUID custom field was not found. Please create it manually from your Netbox interface.')
    }
    const { content_types: types } = uuidCustomField
    if (!types.includes('virtualization.cluster') || !types.includes('virtualization.virtualmachine')) {
      throw new Error(
        'UUID custom field must be assigned to types virtualization.cluster and virtualization.virtualmachine'
      )
    }
  }

  async #synchronize(pools = this.#pools) {
    await this.#checkCustomFields()

    const xo = this.#xo
    log.debug('synchronizing')
    // Cluster type
    const clusterTypes = await this.#makeRequest(
      `/virtualization/cluster-types/?name=${encodeURIComponent(CLUSTER_TYPE)}`,
      'GET'
    )
    if (clusterTypes.length > 1) {
      throw new Error('Found more than 1 "XCP-ng Pool" cluster type')
    }
    let clusterType
    if (clusterTypes.length === 0) {
      clusterType = await this.#makeRequest('/virtualization/cluster-types/', 'POST', {
        name: CLUSTER_TYPE,
        slug: CLUSTER_TYPE.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: 'Created by Xen Orchestra',
      })
    } else {
      clusterType = clusterTypes[0]
    }

    // Clusters
    const clusters = keyBy(
      await this.#makeRequest(`/virtualization/clusters/?type_id=${clusterType.id}`, 'GET'),
      'custom_fields.uuid'
    )

    const clustersToCreate = []
    const clustersToUpdate = []
    for (const poolId of pools) {
      const pool = xo.getObject(poolId)
      const cluster = clusters[pool.uuid]

      const updatedCluster = {
        name: pool.name_label.slice(0, NAME_MAX_LENGTH),
        type: clusterType.id,
        custom_fields: { uuid: pool.uuid },
      }

      if (cluster === undefined) {
        clustersToCreate.push(updatedCluster)
      } else {
        // `type` needs to be flattened so we can compare the 2 objects
        const patch = diff(updatedCluster, { ...cluster, type: cluster.type.id })
        if (patch !== undefined) {
          clustersToUpdate.push({ ...patch, id: cluster.id })
        }
      }
    }

    // FIXME: Should we deduplicate cluster names even though it also fails when
    // a cluster within another cluster type has the same name?
    // FIXME: Should we delete clusters from this cluster type that don't have a
    // UUID?
    Object.assign(
      clusters,
      keyBy(
        flatten(
          await Promise.all(
            clustersToCreate.length === 0
              ? []
              : await this.#makeRequest('/virtualization/clusters/', 'POST', clustersToCreate),
            clustersToUpdate.length === 0
              ? []
              : await this.#makeRequest('/virtualization/clusters/', 'PATCH', clustersToUpdate)
          )
        ),
        'custom_fields.uuid'
      )
    )

    // VMs
    const vms = xo.getObjects({ filter: object => object.type === 'VM' && pools.includes(object.$pool) })
    let oldNetboxVms = flatten(
      // FIXME: It should be doable with one request:
      // `cluster_id=1&cluster_id=2` but it doesn't work
      // https://netbox.readthedocs.io/en/stable/rest-api/filtering/#filtering-objects
      await Promise.all(
        pools.map(poolId =>
          this.#makeRequest(`/virtualization/virtual-machines/?cluster_id=${clusters[poolId].id}`, 'GET')
        )
      )
    )

    const vmsWithNoUuid = oldNetboxVms.filter(vm => vm.custom_fields.uuid === null)
    oldNetboxVms = omit(keyBy(oldNetboxVms, 'custom_fields.uuid'), null)

    // Delete VMs that don't have a UUID custom field. This can happen if they
    // were created manually or if the custom field config was changed after
    // their creation
    if (vmsWithNoUuid !== undefined) {
      log.warn(`Found ${vmsWithNoUuid.length} VMs with no UUID. Deleting them.`)
      await this.#makeRequest(
        '/virtualization/virtual-machines/',
        'DELETE',
        vmsWithNoUuid.map(vm => ({ id: vm.id }))
      )
    }

    // Build collections for later
    const netboxVms = {} // VM UUID → Netbox VM
    const vifsByVm = {} // VM UUID → VIF UUID[]
    const ipsByDeviceByVm = {} // VM UUID → (VIF device → IP)
    const primaryIpsByVm = {} // VM UUID → { ipv4, ipv6 }

    const vmsToCreate = []
    let vmsToUpdate = [] // will be reused for primary IPs
    for (const vm of Object.values(vms)) {
      vifsByVm[vm.uuid] = vm.VIFs
      const vmIpsByDevice = (ipsByDeviceByVm[vm.uuid] = {})

      if (primaryIpsByVm[vm.uuid] === undefined) {
        primaryIpsByVm[vm.uuid] = {}
      }
      if (vm.addresses['0/ipv4/0'] !== undefined) {
        primaryIpsByVm[vm.uuid].ipv4 = vm.addresses['0/ipv4/0']
      }
      if (vm.addresses['0/ipv6/0'] !== undefined) {
        primaryIpsByVm[vm.uuid].ipv6 = ipaddr.parse(vm.addresses['0/ipv6/0']).toString()
      }

      forEach(vm.addresses, (address, key) => {
        const device = key.split('/')[0]
        if (vmIpsByDevice[device] === undefined) {
          vmIpsByDevice[device] = []
        }
        vmIpsByDevice[device].push(address)
      })

      const oldNetboxVm = oldNetboxVms[vm.uuid]
      delete oldNetboxVms[vm.uuid]
      const cluster = clusters[vm.$pool]
      assert(cluster !== undefined)

      const disk = Math.floor(
        vm.$VBDs
          .map(vbdId => xo.getObject(vbdId))
          .filter(vbd => !vbd.is_cd_drive)
          .map(vbd => xo.getObject(vbd.VDI))
          .reduce((total, vdi) => total + vdi.size, 0) / G
      )

      const updatedVm = {
        name: vm.name_label.slice(0, NAME_MAX_LENGTH),
        cluster: cluster.id,
        vcpus: vm.CPUs.number,
        disk,
        memory: Math.floor(vm.memory.dynamic[1] / M),
        custom_fields: { uuid: vm.uuid },
      }

      if (this.#netboxApiVersion !== undefined) {
        // https://netbox.readthedocs.io/en/stable/release-notes/version-2.7/#api-choice-fields-now-use-string-values-3569
        if (semver.satisfies(semver.coerce(this.#netboxApiVersion).version, '>=2.7.0')) {
          updatedVm.status = vm.power_state === 'Running' ? 'active' : 'offline'
        } else {
          updatedVm.status = vm.power_state === 'Running' ? 1 : 0
        }
      }

      if (oldNetboxVm === undefined) {
        vmsToCreate.push(updatedVm)
      } else {
        // Some properties need to be flattened to match the expected POST
        // request objects
        let patch = diff(updatedVm, {
          ...oldNetboxVm,
          cluster: oldNetboxVm.cluster.id,
          status: oldNetboxVm.status?.value,
        })

        // Check if a name mismatch is due to a name deduplication
        if (patch?.name !== undefined) {
          let match
          if ((match = oldNetboxVm.name.match(/.* \((\d+)\)$/)) !== null) {
            if (indexName(patch.name, match[1]) === oldNetboxVm.name) {
              delete patch.name
              if (isEmpty(patch)) {
                patch = undefined
              }
            }
          }
        }

        if (patch !== undefined) {
          // $cluster is needed to deduplicate the VM names within the same
          // cluster. It will be removed at that step.
          vmsToUpdate.push({ ...patch, id: oldNetboxVm.id, $cluster: cluster.id })
        } else {
          netboxVms[vm.uuid] = oldNetboxVm
        }
      }
    }

    // Deduplicate VM names
    vmsToCreate.forEach((vm, i) => {
      const name = vm.name
      let nameIndex = 1
      while (
        find(netboxVms, netboxVm => netboxVm.cluster.id === vm.cluster && netboxVm.name === vm.name) !== undefined ||
        find(
          vmsToCreate,
          (vmToCreate, j) => vmToCreate.cluster === vm.cluster && vmToCreate.name === vm.name && i !== j
        ) !== undefined
      ) {
        if (nameIndex >= 1e3) {
          throw new Error(`Cannot deduplicate name of VM ${name}`)
        }
        vm.name = indexName(name, nameIndex++)
      }
    })
    vmsToUpdate.forEach((vm, i) => {
      const name = vm.name
      if (name === undefined) {
        delete vm.$cluster
        return
      }
      let nameIndex = 1
      while (
        find(netboxVms, netboxVm => netboxVm.cluster.id === vm.$cluster && netboxVm.name === vm.name) !== undefined ||
        find(vmsToCreate, vmToCreate => vmToCreate.cluster === vm.$cluster && vmToCreate.name === vm.name) !==
          undefined ||
        find(
          vmsToUpdate,
          (vmToUpdate, j) => vmToUpdate.$cluster === vm.$cluster && vmToUpdate.name === vm.name && i !== j
        ) !== undefined
      ) {
        if (nameIndex >= 1e3) {
          throw new Error(`Cannot deduplicate name of VM ${name}`)
        }
        vm.name = indexName(name, nameIndex++)
      }
      delete vm.$cluster
    })

    const vmsToDelete = Object.values(oldNetboxVms).map(vm => ({ id: vm.id }))
    Object.assign(
      netboxVms,
      keyBy(
        flatten(
          (
            await Promise.all([
              vmsToDelete.length !== 0 &&
                (await this.#makeRequest('/virtualization/virtual-machines/', 'DELETE', vmsToDelete)),
              vmsToCreate.length === 0
                ? []
                : await this.#makeRequest('/virtualization/virtual-machines/', 'POST', vmsToCreate),
              vmsToUpdate.length === 0
                ? []
                : await this.#makeRequest('/virtualization/virtual-machines/', 'PATCH', vmsToUpdate),
            ])
          ).slice(1)
        ),
        'custom_fields.uuid'
      )
    )

    // Interfaces
    // { vmUuid: { ifName: if } }
    const oldInterfaces = mapValues(
      groupBy(
        flatten(
          await Promise.all(
            pools.map(poolId =>
              this.#makeRequest(`/virtualization/interfaces/?cluster_id=${clusters[poolId].id}`, 'GET')
            )
          )
        ),
        'virtual_machine.id'
      ),
      interfaces => keyBy(interfaces, 'name')
    )

    const interfaces = {} // VIF UUID → interface

    const interfacesToCreateByVif = {} // VIF UUID → interface
    const interfacesToUpdateByVif = {} // VIF UUID → interface
    for (const [vmUuid, vifs] of Object.entries(vifsByVm)) {
      const netboxVmId = netboxVms[vmUuid].id
      const vmInterfaces = oldInterfaces[netboxVmId] ?? {}
      for (const vifId of vifs) {
        const vif = xo.getObject(vifId)
        const name = `eth${vif.device}`

        const oldInterface = vmInterfaces[name]
        delete vmInterfaces[name]

        const updatedInterface = {
          name,
          mac_address: vif.MAC.toUpperCase(),
          virtual_machine: netboxVmId,
        }

        if (oldInterface === undefined) {
          interfacesToCreateByVif[vif.uuid] = updatedInterface
        } else {
          const patch = diff(updatedInterface, {
            ...oldInterface,
            virtual_machine: oldInterface.virtual_machine.id,
          })
          if (patch !== undefined) {
            interfacesToUpdateByVif[vif.uuid] = { ...patch, id: oldInterface.id }
          } else {
            interfaces[vif.uuid] = oldInterface
          }
        }
      }
    }

    const interfacesToDelete = flatten(
      Object.values(oldInterfaces).map(oldInterfacesByName =>
        Object.values(oldInterfacesByName).map(oldInterface => ({ id: oldInterface.id }))
      )
    )
    ;(
      await Promise.all([
        interfacesToDelete.length !== 0 &&
          this.#makeRequest('/virtualization/interfaces/', 'DELETE', interfacesToDelete),
        isEmpty(interfacesToCreateByVif)
          ? {}
          : this.#makeRequest('/virtualization/interfaces/', 'POST', Object.values(interfacesToCreateByVif)).then(
              interfaces => zipObject(Object.keys(interfacesToCreateByVif), interfaces)
            ),
        isEmpty(interfacesToUpdateByVif)
          ? {}
          : this.#makeRequest('/virtualization/interfaces/', 'PATCH', Object.values(interfacesToUpdateByVif)).then(
              interfaces => zipObject(Object.keys(interfacesToUpdateByVif), interfaces)
            ),
      ])
    )
      .slice(1)
      .forEach(newInterfaces => Object.assign(interfaces, newInterfaces))

    // IPs
    const [oldNetboxIps, netboxPrefixes] = await Promise.all([
      this.#makeRequest('/ipam/ip-addresses/', 'GET').then(addresses =>
        groupBy(
          // In Netbox, a device interface and a VM interface can have the same
          // ID and an IP address can be assigned to both types of interface, so
          // we need to make sure that we only get IPs that are assigned to a VM
          // interface before grouping them by their `assigned_object_id`
          addresses.filter(address => address.assigned_object_type === 'virtualization.vminterface'),
          'assigned_object_id'
        )
      ),
      this.#makeRequest('/ipam/prefixes/', 'GET'),
    ])

    const ipsToDelete = []
    const ipsToCreate = []
    const ignoredIps = []
    const netboxIpsByVif = {}
    for (const [vmUuid, vifs] of Object.entries(vifsByVm)) {
      const vmIpsByDevice = ipsByDeviceByVm[vmUuid]
      if (vmIpsByDevice === undefined) {
        continue
      }
      for (const vifId of vifs) {
        const vif = xo.getObject(vifId)
        const vifIps = vmIpsByDevice[vif.device]
        if (vifIps === undefined) {
          continue
        }

        netboxIpsByVif[vifId] = []

        const interface_ = interfaces[vif.uuid]
        const interfaceOldIps = oldNetboxIps[interface_.id] ?? []

        for (const ip of vifIps) {
          const parsedIp = ipaddr.parse(ip)
          const ipKind = parsedIp.kind()
          const ipCompactNotation = parsedIp.toString()

          let smallestPrefix
          let highestBits = 0
          netboxPrefixes.forEach(({ prefix }) => {
            const [range, bits] = prefix.split('/')
            const parsedRange = ipaddr.parse(range)
            if (parsedRange.kind() === ipKind && parsedIp.match(parsedRange, bits) && bits > highestBits) {
              smallestPrefix = prefix
              highestBits = bits
            }
          })
          if (smallestPrefix === undefined) {
            ignoredIps.push(ip)
            continue
          }

          const netboxIpIndex = interfaceOldIps.findIndex(netboxIp => {
            const [ip, bits] = netboxIp.address.split('/')
            return ipaddr.parse(ip).toString() === ipCompactNotation && bits === highestBits
          })

          if (netboxIpIndex >= 0) {
            netboxIpsByVif[vifId].push(interfaceOldIps[netboxIpIndex])
            interfaceOldIps.splice(netboxIpIndex, 1)
          } else {
            ipsToCreate.push({
              address: `${ip}/${smallestPrefix.split('/')[1]}`,
              assigned_object_type: 'virtualization.vminterface',
              assigned_object_id: interface_.id,
              vifId, // needed to populate netboxIpsByVif with newly created IPs
            })
          }
        }
        ipsToDelete.push(...interfaceOldIps.map(oldIp => ({ id: oldIp.id })))
      }
    }

    if (ignoredIps.length > 0) {
      log.warn('Could not find prefix for some IPs: ignoring them.', { ips: ignoredIps })
    }

    await Promise.all([
      ipsToDelete.length !== 0 && this.#makeRequest('/ipam/ip-addresses/', 'DELETE', ipsToDelete),
      ipsToCreate.length !== 0 &&
        this.#makeRequest(
          '/ipam/ip-addresses/',
          'POST',
          ipsToCreate.map(ip => omit(ip, 'vifId'))
        ).then(newNetboxIps => {
          newNetboxIps.forEach((newNetboxIp, i) => {
            const { vifId } = ipsToCreate[i]
            if (netboxIpsByVif[vifId] === undefined) {
              netboxIpsByVif[vifId] = []
            }
            netboxIpsByVif[vifId].push(newNetboxIp)
          })
        }),
    ])

    // Primary IPs
    vmsToUpdate = []
    Object.entries(netboxVms).forEach(([vmId, netboxVm]) => {
      if (netboxVm.primary_ip4 !== null && netboxVm.primary_ip6 !== null) {
        return
      }
      const newNetboxVm = { id: netboxVm.id }
      const vifs = vifsByVm[vmId]
      vifs.forEach(vifId => {
        const netboxIps = netboxIpsByVif[vifId]
        const vmMainIps = primaryIpsByVm[vmId]

        netboxIps?.forEach(netboxIp => {
          const address = netboxIp.address.split('/')[0]
          if (
            newNetboxVm.primary_ip4 === undefined &&
            address === vmMainIps.ipv4 &&
            netboxVm.primary_ip4?.address !== netboxIp.address
          ) {
            newNetboxVm.primary_ip4 = netboxIp.id
          }
          if (
            newNetboxVm.primary_ip6 === undefined &&
            address === vmMainIps.ipv6 &&
            netboxVm.primary_ip6?.address !== netboxIp.address
          ) {
            newNetboxVm.primary_ip6 = netboxIp.id
          }
        })
      })
      if (newNetboxVm.primary_ip4 !== undefined || newNetboxVm.primary_ip6 !== undefined) {
        vmsToUpdate.push(newNetboxVm)
      }
    })

    if (vmsToUpdate.length > 0) {
      await this.#makeRequest('/virtualization/virtual-machines/', 'PATCH', vmsToUpdate)
    }

    log.debug('synchronized')
  }

  async test() {
    const randomSuffix = Math.random().toString(36).slice(2, 11)
    const name = '[TMP] Xen Orchestra Netbox plugin test - ' + randomSuffix
    await this.#makeRequest('/virtualization/cluster-types/', 'POST', {
      name,
      slug: 'xo-test-' + randomSuffix,
      description:
        "This type has been created by Xen Orchestra's Netbox plugin test. If it hasn't been properly deleted, you may delete it manually.",
    })
    const clusterTypes = await this.#makeRequest(
      `/virtualization/cluster-types/?name=${encodeURIComponent(name)}`,
      'GET'
    )

    await this.#checkCustomFields()

    if (clusterTypes.length !== 1) {
      throw new Error('Could not properly write and read Netbox')
    }

    await this.#makeRequest('/virtualization/cluster-types/', 'DELETE', [{ id: clusterTypes[0].id }])
  }
}

export const configurationSchema = ({ xo: { apiMethods } }) => ({
  description:
    'Synchronize pools managed by Xen Orchestra with Netbox. Configuration steps: https://xen-orchestra.com/docs/advanced.html#netbox.',
  type: 'object',
  properties: {
    endpoint: {
      type: 'string',
      title: 'Endpoint',
      description: 'Netbox URI',
    },
    allowUnauthorized: {
      type: 'boolean',
      title: 'Unauthorized certificates',
      description: 'Enable this if your Netbox instance uses a self-signed SSL certificate',
    },
    token: {
      type: 'string',
      title: 'Token',
      description: 'Generate a token with write permissions from your Netbox interface',
    },
    pools: {
      type: 'array',
      title: 'Pools',
      description: 'Pools to synchronize with Netbox',
      items: {
        type: 'string',
        $type: 'pool',
      },
    },
    syncInterval: {
      type: 'number',
      title: 'Interval',
      description: 'Synchronization interval in hours - leave empty to disable auto-sync',
    },
  },
  required: ['endpoint', 'token', 'pools'],
})

export default opts => new Netbox(opts)
