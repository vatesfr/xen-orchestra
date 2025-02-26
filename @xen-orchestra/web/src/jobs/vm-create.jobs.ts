import { useFetch } from '@vueuse/core'

export async function createVM(payload: Record<string, any>, poolId: string) {
  const { data, error } = await useFetch(`/rest/v0/pools/${poolId}/actions/create_vm`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }).text()

  if (error.value) {
    throw new Error(error.value.message)
  }

  return data.value
}
