import { useFetch } from '@vueuse/core'

export default async function createServer(payload: connectServerPayload) {
  const { data, error } = await useFetch(`/rest/v0/servers`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }).text()

  if (error.value) {
    throw new Error(error.value.message)
  }
  return data.value
}

export type connectServerPayload = {
  host: string
  httpProxy: string
  username: string
  password: string
  readOnly: boolean
  allowUnauthorized: boolean
}
