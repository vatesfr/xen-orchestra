export interface ProgressHandler {
  setProgress(total: number): void | Promise<void>
  done(): void | Promise<void>
}
