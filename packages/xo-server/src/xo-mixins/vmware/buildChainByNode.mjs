export function buildDiskChainByNode(disks, snapshots) {
  let chain = []
  if (snapshots && snapshots.current) {
    const currentSnapshotId = snapshots.current

    let currentSnapshot = snapshots.snapshots.find(({ uid }) => uid === currentSnapshotId)

    chain = [currentSnapshot.disks]
    while ((currentSnapshot = snapshots.snapshots.find(({ uid }) => uid === currentSnapshot.parent))) {
      chain.push(currentSnapshot.disks)
    }
    chain.reverse()
  }

  chain.push(disks)

  for (const disk of chain) {
    if (disk.capacity > 2088960 * 1024 * 1024) {
      /* 2TB - 8 MB is the maximum for smapi v1 */
      throw new Error("Can't migrate disks larger than 2TiB")
    }
  }

  const chainsByNodes = {}
  chain.forEach(disks => {
    disks.forEach(disk => {
      chainsByNodes[disk.node] = chainsByNodes[disk.node] || []
      chainsByNodes[disk.node].push(disk)
    })
  })

  return chainsByNodes
}
