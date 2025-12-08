# Type

```typescript
type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  progress?: number
  end?: number
  status: 'failure' | 'interrupted' | 'pending' | 'success'
  tasks?: Task[]
  warning?: { data: unknown; message: string }[]
}
```
