import { AnyXoVm, XoSr } from '@vates/types'

export const isSrWritable = (sr: XoSr) => sr.content_type !== 'iso' && sr.size > 0
export const isReplicaVm = (vm: AnyXoVm) => 'start' in vm.blockedOperations && vm.other['xo:backup:job'] !== undefined
