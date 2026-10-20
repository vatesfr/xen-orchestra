// Decides which VM gets an IP that Netbox refused to create because it already exists
export function resolveIpConflict(candidates, holder) {
  // XO deletes the IPs of its VMs when they're no longer reported, so it must
  // not take an IP created by a user
  if (holder === undefined) {
    return { reason: 'Already exists in Netbox without being assigned' }
  }

  if (!holder.managed) {
    return { reason: 'Already assigned to an object not managed by XO' }
  }

  // The same VM can report the same IP on several interfaces
  candidates = candidates.filter(candidate => candidate.vm !== holder.vm)
  if (candidates.length === 0) {
    return { owner: holder }
  }

  const running = [holder, ...candidates].filter(claimant => claimant.running)
  if (running.length === 1) {
    return { owner: running[0], reason: 'Assigned to the only running VM' }
  }

  return { owner: holder, reason: 'Kept on the VM already holding it' }
}
