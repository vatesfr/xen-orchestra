import { Branded } from '../common.mjs'

export type Task = {
  id: Branded<'task'>

  run: <T>(fn: () => T) => Promise<T>
}
