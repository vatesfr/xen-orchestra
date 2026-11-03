import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed } from 'vue'

export function useVmTags() {
  const { vms } = useXoVmCollection()

  return computed(() => [...new Set(vms.value.flatMap(vm => vm.tags))].sort())
}
