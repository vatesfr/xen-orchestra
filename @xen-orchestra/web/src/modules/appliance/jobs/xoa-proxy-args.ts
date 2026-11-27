import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { defineJobArg } from '@core/packages/job'

export const xoaProxyPayloadArg = defineJobArg<XoaProxyPayload>({
  identify: false,
  toArray: false,
})
