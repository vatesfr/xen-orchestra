import type { XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'

export async function startVm(vm: XoVm): Promise<void> {
  const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/start?async=true`, {
    method: 'POST',
  }).json()

  if (error.value) {
    throw new Error(error.value.message)
  }
}
