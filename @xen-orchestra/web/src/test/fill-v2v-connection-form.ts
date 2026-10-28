import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import type { XoV2vConnection } from '@vates/types'

type V2vConnectionFormFields = {
  formData: { host: string; port: string; username: string; password: string }
}

export function fillV2vConnectionForm(
  form: V2vConnectionFormFields,
  connection: XoV2vConnection = createV2vConnection()
) {
  Object.assign(form.formData, {
    host: connection.host,
    port: String(connection.port),
    username: connection.username,
    password: connection.password,
  })
}
