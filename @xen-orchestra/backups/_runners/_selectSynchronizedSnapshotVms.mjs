import { Task } from '@vates/task'

export function selectSynchronizedSnapshotVms(synchronizedSnapshot, vms) {
  if (synchronizedSnapshot === false) {
    return new Set()
  }

  let matches
  if (typeof synchronizedSnapshot === 'string') {
    matches = vms.filter(vm => vm.tags.includes(synchronizedSnapshot))
  } else if (synchronizedSnapshot === true) {
    matches = vms
  } else {
    Task.warning('unsupported synchronizedSnapshot option, expected a boolean or a tag name', { synchronizedSnapshot })
    return new Set()
  }

  return new Set(matches.map(vm => vm.uuid))
}
