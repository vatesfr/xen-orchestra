// A VDI records which VMware disk of the chain its content was imported from, so that a
// later pass can tell where to continue from:
//  - the delta transfer done after the source VM has been stopped
//  - a run resuming a migration interrupted by an error
//
// The vmdk CID must NOT be used for that: VMware creates a snapshot delta with
// `CID = parentCID`, and only rewrites it when the disk is closed after having been
// written to. Right after XO takes its own snapshot, the base disk and the active delta
// therefore advertise the same CID, and the delta wrongly looks already imported: the
// data written since the snapshot was silently left on the VMware side.
//
// The path of the disk is unique inside a chain, and stable for a given snapshot.
export const VDI_DISK_PATH_KEY = 'esxi_diskPath'

// only kept to resume a migration started by an XO that did not store the disk path yet
export const VDI_LEGACY_CID_KEY = 'esxi_uuid'

/**
 * @param  {ReadonlyArray<{ other_config: Record<string, string> }>} existingVdis VDIs already attached to the target VM
 * @param  {Readonly<{ diskPath: string, uid: string }>} vmdkDisk a disk of the VMware chain
 * @returns {{ other_config: Record<string, string> } | undefined} the VDI holding this disk's content, if any
 */
export function diskIsAlreadyImported(existingVdis, vmdkDisk) {
  return existingVdis.find(vdi => {
    const otherConfig = vdi?.other_config
    if (otherConfig === undefined) {
      return false
    }
    const importedDiskPath = otherConfig[VDI_DISK_PATH_KEY]
    if (importedDiskPath !== undefined) {
      return importedDiskPath === vmdkDisk.diskPath
    }
    const { uid } = vmdkDisk
    if (uid === undefined || uid === vmdkDisk.parentId) {
      // either the descriptor carries no CID, or this disk is a delta that has not been
      // closed yet and still carries the CID of its parent: in both cases the CID cannot
      // identify it. Reporting it as not imported is always the safe answer, it makes the
      // caller start from a shallower disk of the chain
      return false
    }
    return otherConfig[VDI_LEGACY_CID_KEY] === uid
  })
}

/**
 * Index, in the chain, of the deepest disk whose content has already been imported.
 *
 * @param  {ReadonlyArray<{ other_config: Record<string, string> }>} existingVdis VDIs already attached to the target VM
 * @param  {ReadonlyArray<{ diskPath: string, uid: string }>} chainByNode base disk first, active disk last
 * @returns {number} -1 when nothing of this chain has been imported yet
 */
export function findPreviouslyImportedIndex(existingVdis, chainByNode) {
  return chainByNode.findLastIndex(disk => diskIsAlreadyImported(existingVdis, disk) !== undefined)
}
