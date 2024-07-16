import type { RecordId } from '@/types/xo-object.type'

export type Task = {
  id: RecordId<'task'>
  type: 'task'
  start: number
  end: number | undefined
  properties: {
    type: string
    name: string
  }
  status: 'pending' | 'success' | 'failure' | 'interrupted'
  tasks?: Task[]
}
