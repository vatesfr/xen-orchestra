declare module '@xen-orchestra/fs' {
  export interface RemoteHandler {
    list(dir: string, opts?: { prependDir?: boolean }): Promise<string[]>
    [key: string]: unknown
  }

  export interface HandlerDisposable {
    value: RemoteHandler
    dispose: () => Promise<void>
  }

  export function getSyncedHandler(remote: { url: string }): Promise<HandlerDisposable>
}
