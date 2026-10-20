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
