export interface ProgressHandler {
  setProgress(total: number): void | Promise<void>
  done(): void | Promise<void>
}

export class ComposedProgressHandler implements ProgressHandler {
  #handlers: Array<ProgressHandler> = []
  async setProgress(total: number) {
    await Promise.all(this.#handlers.map(handler => handler.setProgress(total)))
  }
  async done() {
    await Promise.all(this.#handlers.map(handler => handler.done()))
  }

  add(handler: ProgressHandler) {
    this.#handlers.push(handler)
  }
}
