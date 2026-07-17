export function selectSynchronizedSnapshotVms(synchronizedSnapshot, vms) {
  if (synchronizedSnapshot === false) {
    return new Set()
  }
  const matches =
    typeof synchronizedSnapshot === 'string' ? vms.filter(vm => vm.tags.includes(synchronizedSnapshot)) : vms
  return new Set(matches.map(vm => vm.uuid))
}
