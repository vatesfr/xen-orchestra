import { Branded } from '../common.mjs'

export interface VatesTask {
  _abortController: AbortController
  _onProgress(data?: unknown): void

  id: Branded<'task'>
  status: 'failure' | 'pending' | 'success'

  abort(reason?: unknown): void
  failure(error?: unknown): void
  info(message: string, data: unknown): void
  run<T>(fn: () => T | (() => Promise<T>)): Promise<T>
  runInside<T>(fn: () => T | (() => Promise<T>)): Promise<T>
  set(name: string, value: unknown): void
  start(): void
  success(result?: unknown): void
  warning(message: string, data: unknown): void
  wrap<T>(fn: () => T | (() => Promise<T>)): Promise<T>
  wrapInside<T>(fn: () => T | (() => Promise<T>)): Promise<T>
}
