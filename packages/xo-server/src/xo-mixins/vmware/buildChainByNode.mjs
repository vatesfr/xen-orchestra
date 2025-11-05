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

  const chainsByNodes = {}
  chain.forEach(disks => {
    disks.forEach(disk => {
      chainsByNodes[disk.node] = chainsByNodes[disk.node] || []
      chainsByNodes[disk.node].push(disk)
    })
  })

  return chainsByNodes
}
