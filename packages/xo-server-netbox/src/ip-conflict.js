/**
 * Decides which VM should own an IP address that Netbox refused to create
 * because it already exists
 * @param {{ vm: string, running: boolean }[]} candidates XO VMs reporting the IP and that couldn't get it
 * @param {{ managed: false } | { managed: true, vm: string, running: boolean } | undefined} holder current owner of the IP in Netbox
 * @returns {{ owner?: object, reason?: string }} `reason` is defined if some VMs won't get the IP
 */
export function resolveIpConflict(candidates, holder) {
  if (holder !== undefined && !holder.managed) {
    return { reason: 'Already assigned to an object not managed by XO' }
  }

  if (holder !== undefined) {
    // The same VM can report the same IP on several interfaces
    candidates = candidates.filter(candidate => candidate.vm !== holder.vm)
    if (candidates.length === 0) {
      return { owner: holder }
    }
  }

  const claimants = holder === undefined ? candidates : [holder, ...candidates]
  if (claimants.length === 1) {
    return { owner: claimants[0] }
  }

  const running = claimants.filter(claimant => claimant.running)
  if (running.length === 1) {
    return { owner: running[0], reason: 'Assigned to the only running VM' }
  }

  if (holder !== undefined) {
    return { owner: holder, reason: 'Kept on the VM already holding it' }
  }

  return { reason: 'Reported by several VMs' }
}
