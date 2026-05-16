declare module '@vates/task' {
  export class Task {
    readonly id: string
    readonly status: 'pending' | 'success' | 'failure'

    constructor(opts?: { properties?: Record<string, unknown> })

    start(): void
    success(result?: unknown): void
    failure(error?: unknown): void
    run<T>(fn: () => T | Promise<T>): Promise<T>
    set(name: string, value: unknown): void

    static set(name: string, value: unknown): void
  }
}
