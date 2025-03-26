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
  }
  status: 'pending' | 'success' | 'failure' | 'interrupted'
  tasks?: XoTask[]
}
