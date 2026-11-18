import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { defineJobArg } from '@core/packages/job'

export const sshKeysArg = defineJobArg<SshKey>({
  identify: false,
  toArray: true,
})
