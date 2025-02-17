import { useFetch } from '@vueuse/core'

// "355ee47d-ff4c-4924-3db2-fd86ae629676"
export async function createVM<T>(payload: Record<string, any>, poolId: string) {
  const { data, error } = await useFetch(`/rest/v0/pools/${poolId}/actions/create_vm`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  }).json<T>()

  if (error.value) {
    throw new Error(error.value.message)
  }

  return data.value
}
