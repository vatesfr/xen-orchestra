import ipaddr from 'ipaddr.js'
import semver from 'semver'
import { createLogger } from '@xen-orchestra/log'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import trimEnd from 'lodash/trimEnd'

import diff from './diff'
import { deduplicateName } from './name-dedup'
import slugify from './slugify'

const log = createLogger('xo:netbox')

const CLUSTER_TYPE = 'XCP-ng Pool'
const TYPES_WITH_UUID = ['virtualization.cluster', 'virtualization.virtualmachine', 'virtualization.vminterface']
const CHUNK_SIZE = 100
export const NAME_MAX_LENGTH = 64
export const DESCRIPTION_MAX_LENGTH = 200
const REQUEST_TIMEOUT = 120e3 // 2min
const M = 1024 ** 2
const G = 1024 ** 3

const { push } = Array.prototype

// =============================================================================

export configurationSchema from './configuration-schema'
export default opts => new Netbox(opts)

// =============================================================================

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

    this.getObject = function getObject(id) {
      try {
        return this.#xo.getObject(id)
      } catch (err) {}
    }

    this.getObjects = xo.getObjects.bind(xo)
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

  async test() {
    const randomSuffix = Math.random().toString(36).slice(2, 11)
    const name = '[TMP] Xen Orchestra Netbox plugin test - ' + randomSuffix
    await this.#request('/virtualization/cluster-types/', 'POST', {
      name,
      slug: 'xo-test-' + randomSuffix,
      description:
        "This type has been created by Xen Orchestra's Netbox plugin test. If it hasn't been properly deleted, you may delete it manually.",
    })
    const clusterTypes = await this.#request(`/virtualization/cluster-types/?name=${encodeURIComponent(name)}`)

    await this.#checkCustomFields()

    if (clusterTypes.length !== 1) {
      throw new Error('Could not properly write and read Netbox')
    }

    await this.#request('/virtualization/cluster-types/', 'DELETE', [{ id: clusterTypes[0].id }])
  }

  async #request(path, method = 'GET', data) {
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
    const customFields = await this.#request('/extras/custom-fields/')
    const uuidCustomField = customFields.find(field => field.name === 'uuid')
    if (uuidCustomField === undefined) {
      throw new Error('UUID custom field was not found. Please create it manually from your Netbox interface.')
    }
    const { content_types: types } = uuidCustomField
    if (TYPES_WITH_UUID.some(type => !types.includes(type))) {
      throw new Error('UUID custom field must be assigned to types ' + TYPES_WITH_UUID.join(', '))
    }
  }

  // ---------------------------------------------------------------------------

  async #synchronize(pools = this.#pools) {
    await this.#checkCustomFields()

    log.info(`Synchronizing ${pools.length} pools with Netbox`, { pools })

    // Cluster type ------------------------------------------------------------

    // Create a single cluster type called "XCP-ng Pool" to identify clusters
    // that have been created from XO

    // Check if a cluster type called XCP-ng already exists otherwise create it
    const clusterTypes = await this.#request(`/virtualization/cluster-types/?name=${encodeURIComponent(CLUSTER_TYPE)}`)
    if (clusterTypes.length > 1) {
      throw new Error('Found more than 1 "XCP-ng Pool" cluster type')
    }
    let clusterType
    if (clusterTypes.length === 0) {
      log.info('Creating cluster type')
      clusterType = await this.#request('/virtualization/cluster-types/', 'POST', {
        name: CLUSTER_TYPE,
        slug: slugify(CLUSTER_TYPE),
        description: 'Created by Xen Orchestra',
      })
    } else {
      clusterType = clusterTypes[0]
    }

    // Clusters ----------------------------------------------------------------

    // Update and create clusters. Deleting a cluster is manual action.

    log.info('Synchronizing clusters')

    const createCluster = (pool, clusterType) => ({
      custom_fields: { uuid: pool.uuid },
      name: pool.name_label.slice(0, NAME_MAX_LENGTH),
      type: clusterType.id,
    })

    // { Pool UUID → cluster }
    const allClusters = keyBy(
      await this.#request(`/virtualization/clusters/?type_id=${clusterType.id}`),
      'custom_fields.uuid'
    )
    const clusters = pick(allClusters, pools)

    if (!isEmpty(allClusters[undefined])) {
      // FIXME: Should we delete clusters from this cluster type that don't have
      //        a UUID?
      log.warn('Found some clusters with missing UUID custom field', allClusters[undefined])
    }

    const clustersToCreate = []
    const clustersToUpdate = []
    for (const poolId of pools) {
      const pool = this.getObject(poolId)
      if (pool === undefined) {
        // If we can't find the pool, don't synchronize anything within that pool
        log.warn('Synchronizing pools: cannot find pool', { pool: poolId })
        delete allClusters[poolId]
        delete clusters[poolId]
        continue
      }
      const cluster = clusters[pool.uuid]

      const updatedCluster = createCluster(pool, clusterType)

      if (cluster === undefined) {
        clustersToCreate.push(updatedCluster)
      } else {
        // `type` needs to be flattened so we can compare the 2 objects
        const patch = diff(updatedCluster, { ...cluster, type: cluster.type.id })
        if (patch !== undefined) {
          clustersToUpdate.push(patch)
        }
      }
    }

    // FIXME: Should we deduplicate cluster names even though it also fails
    //        when a cluster within another cluster type has the same name?
    const newClusters = []
    if (clustersToUpdate.length > 0) {
      log.info(`Updating ${clustersToUpdate.length} clusters`)
      newClusters.push(...(await this.#request('/virtualization/clusters/', 'PATCH', clustersToUpdate)))
    }
    if (clustersToCreate.length > 0) {
      log.info(`Creating ${clustersToCreate.length} clusters`)
      newClusters.push(...(await this.#request('/virtualization/clusters/', 'POST', clustersToCreate)))
    }
    Object.assign(clusters, keyBy(newClusters, 'custom_fields.uuid'))
    Object.assign(allClusters, clusters)
    // Only keep pools that were found in XO and up to date in Netbox
    pools = Object.keys(clusters)

    const clusterFilter = Object.values(clusters)
      .map(cluster => `cluster_id=${cluster.id}`)
      .join('&')

    // VMs ---------------------------------------------------------------------

    log.info('Synchronizing VMs')

    const createNetboxVm = async (vm, { cluster, platforms }) => {
      const netboxVm = {
        custom_fields: { uuid: vm.uuid },
        name: vm.name_label.slice(0, NAME_MAX_LENGTH).trim(),
        comments: vm.name_description.slice(0, DESCRIPTION_MAX_LENGTH).trim(),
        vcpus: vm.CPUs.number,
        disk: Math.floor(
          vm.$VBDs
            .map(vbdId => this.getObject(vbdId))
            .filter(vbd => !vbd.is_cd_drive)
            .map(vbd => this.getObject(vbd.VDI))
            .reduce((total, vdi) => total + vdi.size, 0) / G
        ),
        memory: Math.floor(vm.memory.dynamic[1] / M),
        cluster: cluster.id,
        status: vm.power_state === 'Running' ? 'active' : 'offline',
        platform: null,
      }

      const distro = vm.os_version?.distro
      if (distro != null) {
        const slug = slugify(distro)
        let platform = find(platforms, { slug })
        if (platform === undefined) {
          // TODO: Should we also delete/update platforms in Netbox?
          platform = await this.#request('/dcim/platforms/', 'POST', {
            name: distro,
            slug,
          })
          platforms[platform.id] = platform
        }

        netboxVm.platform = platform.id
      }

      // https://netbox.readthedocs.io/en/stable/release-notes/version-2.7/#api-choice-fields-now-use-string-values-3569
      if (
        this.#netboxApiVersion !== undefined &&
        !semver.satisfies(semver.coerce(this.#netboxApiVersion).version, '>=2.7.0')
      ) {
        netboxVm.status = vm.power_state === 'Running' ? 1 : 0
      }

      return netboxVm
    }

    // Some props need to be flattened to satisfy the POST request schema
    const flattenNested = vm => ({
      ...vm,
      cluster: vm.cluster?.id ?? null,
      status: vm.status?.value ?? null,
      platform: vm.platform?.id ?? null,
    })

    const platforms = keyBy(await this.#request('/dcim/platforms'), 'id')

    // Get all the VMs in the cluster type "XCP-ng Pool" even from clusters
    // we're not synchronizing right now, so we can "migrate" them back if
    // necessary
    const allNetboxVmsList = (await this.#request('/virtualization/virtual-machines/')).filter(
      netboxVm => Object.values(allClusters).find(cluster => cluster.id === netboxVm.cluster.id) !== undefined
    )
    // Then get only the ones from the pools we're synchronizing
    const netboxVmsList = allNetboxVmsList.filter(
      netboxVm => Object.values(clusters).find(cluster => cluster.id === netboxVm.cluster.id) !== undefined
    )
    // Then make them objects to map the Netbox VMs to their XO VMs
    // { VM UUID → Netbox VM }
    const allNetboxVms = keyBy(allNetboxVmsList, 'custom_fields.uuid')
    const netboxVms = keyBy(netboxVmsList, 'custom_fields.uuid')

    const usedNames = [] // Used for name deduplication
    // Build the 3 collections of VMs and perform all the API calls at the end
    const vmsToDelete = netboxVmsList
      .filter(netboxVm => netboxVm.custom_fields.uuid == null)
      .map(netboxVm => ({ id: netboxVm.id }))
    const vmsToUpdate = []
    const vmsToCreate = []
    for (const poolId of pools) {
      // Get XO VMs that are on this pool
      const poolVms = this.getObjects({ filter: { type: 'VM', $pool: poolId } })

      const cluster = clusters[poolId]

      // Get Netbox VMs that are supposed to be in this pool
      const poolNetboxVms = pickBy(netboxVms, netboxVm => netboxVm.cluster.id === cluster.id)

      // For each XO VM of this pool (I)
      for (const vm of Object.values(poolVms)) {
        // Grab the Netbox VM from the list of all VMs so that if the VM is on
        // another cluster, we update the existing object instead of creating a
        // new one
        const netboxVm = allNetboxVms[vm.uuid]
        delete poolNetboxVms[vm.uuid]

        const updatedVm = await createNetboxVm(vm, { cluster, platforms })

        if (netboxVm !== undefined) {
          // VM found in Netbox: update VM (I.1)
          const patch = diff(updatedVm, flattenNested(netboxVm))
          if (patch !== undefined) {
            vmsToUpdate.push(patch)
          } else {
            // The VM is up to date, just store its name as being used
            usedNames.push(netboxVm.name)
          }
        } else {
          // VM not found in Netbox: create VM (I.2)
          vmsToCreate.push(updatedVm)
        }
      }

      // For each REMAINING Netbox VM of this pool (II)
      for (const netboxVm of Object.values(poolNetboxVms)) {
        const vmUuid = netboxVm.custom_fields?.uuid
        const vm = this.getObject(vmUuid)
        // We check if the VM was moved to another pool in XO
        const pool = this.getObject(vm?.$pool)
        const cluster = allClusters[pool?.uuid]
        if (cluster !== undefined) {
          // If the VM is found in XO: update it if necessary (II.1)
          const updatedVm = await createNetboxVm(vm, { cluster, platforms })
          const patch = diff(updatedVm, flattenNested(netboxVm))

          if (patch === undefined) {
            // Should never happen since at least the cluster should be different
            log.warn('Found a VM that should be on another cluster', { vm: netboxVm })
            continue
          }

          vmsToUpdate.push(patch)
        } else {
          // Otherwise, delete it from Netbox (II.2)
          vmsToDelete.push({ id: netboxVm.id })
          delete netboxVms[vmUuid]
        }
      }
    }

    // Deduplicate VM names
    // Deduplicate vmsToUpdate first to avoid back and forth changes
    // Deduplicate even between pools to simplify and avoid back and forth
    //   changes if the VM is migrated
    for (const netboxVm of [...vmsToUpdate, ...vmsToCreate]) {
      if (netboxVm.name === undefined) {
        continue
      }
      netboxVm.name = deduplicateName(netboxVm.name, usedNames)
      usedNames.push(netboxVm.name)
    }

    // Perform calls to Netbox. "Delete → Update → Create" one at a time to
    // avoid name conflicts with outdated VMs
    const newVms = []
    if (vmsToDelete.length > 0) {
      log.info(`Deleting ${vmsToDelete.length} VMs`)
      await this.#request('/virtualization/virtual-machines/', 'DELETE', vmsToDelete)
    }
    if (vmsToUpdate.length > 0) {
      log.info(`Updating ${vmsToUpdate.length} VMs`)
      newVms.push(...(await this.#request('/virtualization/virtual-machines/', 'PATCH', vmsToUpdate)))
    }
    if (vmsToCreate.length > 0) {
      log.info(`Creating ${vmsToCreate.length} VMs`)
      newVms.push(...(await this.#request('/virtualization/virtual-machines/', 'POST', vmsToCreate)))
    }
    Object.assign(netboxVms, keyBy(newVms, 'custom_fields.uuid'))
    Object.assign(allNetboxVms, netboxVms)

    // VIFs --------------------------------------------------------------------

    log.info('Synchronizing VIFs')

    const createIf = (vif, vm) => {
      const name = `eth${vif.device}`
      const netboxVm = netboxVms[vm.uuid]

      const netboxIf = {
        custom_fields: { uuid: vif.uuid },
        name,
        mac_address: vif.MAC.toUpperCase(),
      }

      if (netboxVm !== undefined) {
        netboxIf.virtual_machine = netboxVm.id
      }

      return netboxIf
    }

    const netboxIfsList = await this.#request(`/virtualization/interfaces/?${clusterFilter}`)
    // { ID → Interface }
    const netboxIfs = keyBy(netboxIfsList, 'custom_fields.uuid')

    const ifsToDelete = netboxIfsList
      .filter(netboxIf => netboxIf.custom_fields.uuid == null)
      .map(netboxIf => ({ id: netboxIf.id }))
    const ifsToUpdate = []
    const ifsToCreate = []
    for (const netboxVm of Object.values(netboxVms)) {
      const vm = this.getObject(netboxVm.custom_fields.uuid)
      if (vm === undefined) {
        log.warn('Synchronizing VIFs: cannot find VM from UUID custom field', { vm: netboxVm.custom_fields.uuid })
        continue
      }
      // Start by deleting old interfaces attached to this Netbox VM
      Object.entries(netboxIfs).forEach(([id, netboxIf]) => {
        if (netboxIf.virtual_machine.id === netboxVm.id && !vm.VIFs.includes(netboxIf.custom_fields.uuid)) {
          ifsToDelete.push({ id: netboxIf.id })
          delete netboxIfs[id]
        }
      })

      // For each XO VIF, create or update the Netbox interface
      for (const vifId of vm.VIFs) {
        const vif = this.getObject(vifId)
        const netboxIf = netboxIfs[vif.uuid]
        const updatedIf = createIf(vif, vm)
        if (netboxIf === undefined) {
          ifsToCreate.push(updatedIf)
        } else {
          // `virtual_machine` needs to be flattened so we can compare the 2 objects
          const patch = diff(updatedIf, { ...netboxIf, virtual_machine: netboxIf.virtual_machine.id })
          if (patch !== undefined) {
            ifsToUpdate.push(patch)
          }
        }
      }
    }

    // Perform calls to Netbox
    const newIfs = []
    if (ifsToDelete.length > 0) {
      log.info(`Deleting ${ifsToDelete.length} interfaces`)
      await this.#request('/virtualization/interfaces/', 'DELETE', ifsToDelete)
    }
    if (ifsToUpdate.length > 0) {
      log.info(`Updating ${ifsToUpdate.length} interfaces`)
      newIfs.push(...(await this.#request('/virtualization/interfaces/', 'PATCH', ifsToUpdate)))
    }
    if (ifsToCreate.length > 0) {
      log.info(`Creating ${ifsToCreate.length} interfaces`)
      newIfs.push(...(await this.#request('/virtualization/interfaces/', 'POST', ifsToCreate)))
    }
    Object.assign(netboxIfs, keyBy(newIfs, 'custom_fields.uuid'))

    // IPs ---------------------------------------------------------------------

    log.info('Synchronizing IP addresses')

    const createIp = (ip, prefix, netboxIf) => {
      return {
        address: `${ip}/${prefix.split('/')[1]}`,
        assigned_object_type: 'virtualization.vminterface',
        assigned_object_id: netboxIf,
      }
    }

    // In Netbox, a device interface and a VM interface can have the same ID and
    // an IP address can be assigned to both types of interface, so we need to
    // make sure that we only get IPs that are assigned to a VM interface
    const netboxIps = keyBy(
      (await this.#request('/ipam/ip-addresses/')).filter(
        address => address.assigned_object_type === 'virtualization.vminterface'
      ),
      'id'
    )
    const netboxPrefixes = await this.#request('/ipam/prefixes/')

    const ipsToDelete = []
    const ipsToCreate = []
    const ignoredIps = [] // IPs for which a valid prefix could not be found in Netbox
    // For each VM, for each interface, for each IP: create IP in Netbox
    for (const netboxVm of Object.values(netboxVms)) {
      const vm = this.getObject(netboxVm.custom_fields.uuid)
      if (vm === undefined) {
        log.warn('Synchronizing IPs: cannot find VM from UUID custom field', { vm: netboxVm.custom_fields.uuid })
        continue
      }

      // Find the Netbox interface associated with the vif
      const netboxVmIfs = Object.values(netboxIfs).filter(netboxIf => netboxIf.virtual_machine.id === netboxVm.id)
      for (const netboxIf of netboxVmIfs) {
        // Store old IPs and remove them one by one. At the end, delete the remaining ones.
        const netboxIpsToCheck = pickBy(netboxIps, netboxIp => netboxIp.assigned_object_id === netboxIf.id)

        const vif = this.getObject(netboxIf.custom_fields.uuid)
        if (vif === undefined) {
          // Cannot create IPs if interface was not found
          log.warn('Could not find VIF', { vm: vm.uuid, vif: netboxIf.custom_fields.uuid })
          continue
        }
        const ips = Object.values(pickBy(vm.addresses, (_, key) => key.startsWith(vif.device + '/')))
        for (const ip of ips) {
          const parsedIp = ipaddr.parse(ip)
          const ipKind = parsedIp.kind()

          // Find the smallest prefix within Netbox's existing prefixes
          // Users must create prefixes themselves
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
            // A valid prefix is required to create an IP in Netbox. If none matches, ignore the IP.
            ignoredIps.push({ vm: vm.uuid, ip })
            continue
          }

          const compactIp = parsedIp.toString() // use compact notation (e.g. ::1) before ===-comparison
          const netboxIp = find(netboxIpsToCheck, netboxIp => {
            const [ip, bits] = netboxIp.address.split('/')
            return ipaddr.parse(ip).toString() === compactIp && bits === highestBits
          })
          if (netboxIp !== undefined) {
            // IP is up to date, don't do anything with it
            delete netboxIpsToCheck[netboxIp.id]
          } else {
            // IP wasn't found in Netbox, create it
            ipsToCreate.push(createIp(ip, smallestPrefix, netboxIf.id))
          }
        }

        // Delete the remaining IPs found in Netbox for this VM
        ipsToDelete.push(...Object.values(netboxIpsToCheck).map(netboxIp => ({ id: netboxIp.id })))
      }
    }

    if (ignoredIps.length > 0) {
      // Only show the first ignored IP in order to not flood logs if there are
      // many and it should be enough to fix the issues one by one
      log.warn(`Could not find matching prefix in Netbox for ${ignoredIps.length} IP addresses`, ignoredIps[0])
    }

    // Perform calls to Netbox
    if (ipsToDelete.length > 0) {
      log.info(`Deleting ${ipsToDelete.length} IPs`)
      await this.#request('/ipam/ip-addresses/', 'DELETE', ipsToDelete)
    }
    if (ipsToCreate.length > 0) {
      log.info(`Creating ${ipsToCreate.length} IPs`)
      Object.assign(netboxIps, keyBy(await this.#request('/ipam/ip-addresses/', 'POST', ipsToCreate), 'id'))
    }

    // Primary IPs -------------------------------------------------------------

    // Use the first IPs found in vm.addresses as the VMs' primary IPs in
    // Netbox, both for IPv4 and IPv6

    log.info("Setting VMs' primary IPs")

    const vmsToUpdate2 = []
    for (const netboxVm of Object.values(netboxVms)) {
      const vm = this.getObject(netboxVm.custom_fields.uuid)
      if (vm === undefined) {
        log.warn('Updating primary IPs: cannot find VM from UUID custom field', { vm: netboxVm.custom_fields.uuid })
        continue
      }
      const patch = { id: netboxVm.id }

      const netboxVmIps = Object.values(netboxIps).filter(
        netboxIp => netboxIp.assigned_object?.virtual_machine.id === netboxVm.id
      )

      const ipv4 = vm.addresses['0/ipv4/0']
      if (ipv4 === undefined && netboxVm.primary_ip4 !== null) {
        patch.primary_ip4 = null
      } else if (ipv4 !== undefined) {
        const netboxIp = netboxVmIps.find(netboxIp => netboxIp.address.split('/')[0] === ipv4)
        if (netboxIp === undefined && netboxVm.primary_ip4 !== null) {
          patch.primary_ip4 = null
        } else if (netboxIp !== undefined && netboxIp.id !== netboxVm.primary_ip4?.id) {
          patch.primary_ip4 = netboxIp.id
        }
      }

      const _ipv6 = vm.addresses['0/ipv6/0']
      // For IPv6, compare with the compact notation
      const ipv6 = _ipv6 && ipaddr.parse(_ipv6).toString()
      if (ipv6 === undefined && netboxVm.primary_ip6 !== null) {
        patch.primary_ip6 = null
      } else if (ipv6 !== undefined) {
        const netboxIp = netboxVmIps.find(netboxIp => netboxIp.address.split('/')[0] === ipv6)
        if (netboxIp === undefined && netboxVm.primary_ip6 !== null) {
          patch.primary_ip6 = null
        } else if (netboxIp !== undefined && netboxIp.id !== netboxVm.primary_ip6?.id) {
          patch.primary_ip6 = netboxIp.id
        }
      }

      if (patch.primary_ip4 !== undefined || patch.primary_ip6 !== undefined) {
        vmsToUpdate2.push(patch)
      }
    }

    if (vmsToUpdate2.length > 0) {
      log.info(`Updating primary IPs of ${vmsToUpdate2.length} VMs`)
      Object.assign(netboxVms, keyBy(await this.#request('/virtualization/virtual-machines/', 'PATCH', vmsToUpdate2)))
    }

    log.info(`Done synchronizing ${pools.length} pools with Netbox`, { pools })
  }
}
