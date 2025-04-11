import type { Message } from '@core/types/task.type.ts'
import type { Branded } from '@core/types/utility.type'

export type XoTask = {
  id: Branded<'task'>
  type: 'task'
  start: number
  end: number | undefined
  updatedAt: number
  properties: {
    type: string
    name: string
    userId?: Branded<'user'>
    progress?: number
    hostId?: Branded<'host'>
    hostName?: string
    poolId?: Branded<'pool'>
    poolName?: string
  }
  status: 'pending' | 'success' | 'failure' | 'interrupted'
  tasks?: XoTask[]
  infos?: Message[]
  errors?: Message[]
  warnings?: Message[]
}
