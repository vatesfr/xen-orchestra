# Type

```typescript
type TaskStatus = 'failure' | 'interrupted' | 'pending' | 'success'

type TaskObjectSegment = {
  text: string
  to?: RouteLocationRaw
}

type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  nameParts?: TaskObjectSegment[]
  to?: LinkOptions['to']
  progress?: number
  tag?: string
  userName?: string
  start?: number
  end?: number
  status: TaskStatus
  subtasks?: Task[]
  warnings?: { data: unknown; message: string }[]
}
```
