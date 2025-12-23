import { defineJobArg } from '@core/packages/job'
import type { XoServer } from '@vates/types'
import type { Ref } from 'vue'

export const serverIdsArg = defineJobArg<Ref<XoServer['id']>>({
  identify: serverId => serverId.value,
  toArray: true,
})
