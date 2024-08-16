import type { Branded } from '@core/types/utility.type'

export type XoTask = {
  id: Branded<'task'>
  type: 'task'
  start: number
  end: number | undefined
  properties: {
    type: string
    name: string
  }
  status: 'pending' | 'success' | 'failure' | 'interrupted'
  tasks?: XoTask[]
}
