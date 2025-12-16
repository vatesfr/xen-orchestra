import type { XoHost, XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'

async function vmAction(vmId: XoVm['id'], action: string, body?: Record<string, any>): Promise<void> {
  const { error } = await useFetch(`/rest/v0/vms/${vmId}/actions/${action}`, {
    method: 'POST',
    ...(body && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  })

  if (error.value) {
    throw new Error(error.value.message)
  }
}

export async function startVm(vmId: XoVm['id'], hostId?: XoHost['id']): Promise<void> {
  return vmAction(vmId, 'start', hostId ? { hostId } : undefined)
}
