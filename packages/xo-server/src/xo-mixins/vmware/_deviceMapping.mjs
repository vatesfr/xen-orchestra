/**
 * Throws when a mapping names a disk or a NIC the VM does not have: it would otherwise import that
 * device to the default destination without telling anybody.
 *
 * @param {{ disks: { node: string }[], networks: { key: string }[] }} metadata - from `getTransferableVmMetadata`
 * @param {object} mapping
 * @param {Record<string, string>} mapping.srIdsByNode
 * @param {Record<string, string>} mapping.networkIdsByNic
 * @param {string} mapping.vmId
 */
export function assertKnownDevices({ disks, networks }, { srIdsByNode, networkIdsByNic, vmId }) {
  const nodes = new Set(disks.map(disk => disk.node))
  const nicKeys = new Set(networks.map(network => network.key))
  const unknownNodes = Object.keys(srIdsByNode).filter(node => !nodes.has(node))
  const unknownNics = Object.keys(networkIdsByNic).filter(key => !nicKeys.has(key))
  if (unknownNodes.length !== 0 || unknownNics.length !== 0) {
    const missing = [...unknownNodes.map(node => `disk ${node}`), ...unknownNics.map(key => `NIC ${key}`)]
    /** @type {Error & { code?: string }} */
    const error = new Error(`the VM ${vmId} has no ${missing.join(', ')}`)
    error.code = 'UNKNOWN_DEVICE'
    Object.assign(error, { vmId, unknownNodes, unknownNics, nodes: [...nodes], nicKeys: [...nicKeys] })
    throw error
  }
}

/**
 * Resolves the destinations of the disks and of the NICs: they must all be in the pool of `sr`, where
 * the VM is created, a VDI or a VIF on another pool could not be attached to it.
 *
 * @param {{ getXapiObject: (id: string, type: string) => { $pool: { uuid: string } } }} app
 * @param {object} mapping
 * @param {{ $pool: { uuid: string } }} mapping.sr - default SR, the VM is created in its pool
 * @param {string} mapping.srId
 * @param {string} mapping.networkId - default network
 * @param {Record<string, string>} mapping.srIdsByNode
 * @param {Record<string, string>} mapping.networkIdsByNic
 * @param {string} mapping.vmId
 */
export function resolveDestinations(app, { sr, srId, networkId, srIdsByNode, networkIdsByNic, vmId }) {
  const poolId = sr.$pool.uuid
  const srsByNode = {}
  for (const [node, diskSrId] of Object.entries(srIdsByNode)) {
    const diskSr = app.getXapiObject(diskSrId, 'SR')
    if (diskSr.$pool.uuid !== poolId) {
      /** @type {Error & { code?: string }} */
      const error = new Error(`the SR ${diskSrId} of disk ${node} is not in the pool of the SR ${srId}`)
      error.code = 'SR_NOT_IN_POOL'
      Object.assign(error, { vmId, node, srId: diskSrId, poolId })
      throw error
    }
    srsByNode[node] = diskSr
  }
  const getPoolNetwork = (id, nic) => {
    const network = app.getXapiObject(id, 'network')
    if (network.$pool.uuid !== poolId) {
      /** @type {Error & { code?: string }} */
      const error = new Error(
        `the network ${id}${nic === undefined ? '' : ` of NIC ${nic}`} is not in the pool of the SR ${srId}`
      )
      error.code = 'NETWORK_NOT_IN_POOL'
      Object.assign(error, { vmId, nic, networkId: id, poolId })
      throw error
    }
    return network
  }
  const network = getPoolNetwork(networkId)
  const networksByNic = {}
  for (const [nic, nicNetworkId] of Object.entries(networkIdsByNic)) {
    networksByNic[nic] = getPoolNetwork(nicNetworkId, nic)
  }
  return { srsByNode, network, networksByNic }
}
