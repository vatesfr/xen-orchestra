import type { XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'

export async function startVm(vms: XoVm[]): Promise<void> {
  await Promise.all(
    vms.map(async vm => {
      const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/start?sync=false`, {
        method: 'POST',
      }).json()

      if (error.value) {
        throw new Error(error.value.message)
      }
    })
  )
}
