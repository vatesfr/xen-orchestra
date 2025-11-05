import type { XoPool } from '@/types/xo/pool.type.ts'
import type { XoVm } from '@/types/xo/vm.type'
import { useFetch } from '@vueuse/core'

export async function createVM(payload: Record<string, any>, poolId: XoPool['id']): Promise<XoVm['id']> {
  const { data, error } = await useFetch(`/rest/v0/pools/${poolId}/actions/create_vm?sync=true`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }).json<{ id: XoVm['id'] }>()

  if (error.value) {
    throw new Error(error.value.message)
  }
  return data.value!.id
}
