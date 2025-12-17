import type { XoHost, XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'

async function vmAction(vmId: XoVm['id'], action: string, body?: Record<string, any>): Promise<void> {
  const { error } = await useFetch(`/rest/v0/vms/${vmId}/actions/${action}?sync=true`, {
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

export const vmActions = {
  start: (vmId: XoVm['id'], hostId?: XoHost['id']) => vmAction(vmId, 'start', hostId ? { hostId } : undefined),
}
