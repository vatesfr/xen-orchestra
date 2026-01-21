import { defineJobArg } from '@core/packages/job'
import type { XoHost, XoServer, XoVm } from '@vates/types'
import type { Ref } from 'vue'

export const xoServerIdsArg = defineJobArg<Ref<XoServer['id']>>({
  identify: serverId => serverId.value,
  toArray: true,
})

export const vmsArg = defineJobArg({
  identify: (vm: XoVm) => vm.id,
  toArray: true,
})

export const hostArg = defineJobArg({
  identify: (host: XoHost | undefined) => host?.id,
  toArray: false,
})
