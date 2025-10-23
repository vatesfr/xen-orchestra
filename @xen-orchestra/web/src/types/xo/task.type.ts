import type { Branded } from '@core/types/utility.type'

export type XoTask = {
  abortionRequestedAt?: number
  end?: number
  id: Branded<'task'>
  infos?: { data: unknown; message: string }[]
  properties: {
    method?: string
    name?: string
    objectId?: string
    params?: Record<string, unknown>
    progress?: number
    type?: string
    userId?: string
    [key: string]: unknown | undefined
  }
  result: Record<string, unknown>
  start: number
  status: 'failure' | 'interrupted' | 'pending' | 'success'
  tasks?: XoTask[]
  updatedAt?: number
  warning?: { data: unknown; message: string }[]
}
