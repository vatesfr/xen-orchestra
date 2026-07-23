// Ambient declarations for untyped external packages used by this module.
// (CLAUDE.md: "Add declaration.d.ts for untyped external packages.")

declare module '@vates/read-chunk' {
  import type { Readable } from 'node:stream'

  /**
   * Resolves to exactly `size` bytes read from `stream`, or `null` if the
   * stream ends before any byte of the requested chunk is available.
   */
  export function readChunk(stream: Readable, size?: number): Promise<Buffer | null>

  /**
   * Resolves to exactly `size` bytes read from `stream`; rejects if the stream
   * ends before `size` bytes have been read.
   */
  export function readChunkStrict(stream: Readable, size: number): Promise<Buffer>
}

declare module 'promise-toolbox' {
  /**
   * Reject the promise it is bound to if it does not settle within `delay`
   * milliseconds. Used as `pTimeout.call(promise, delay)`.
   */
  interface PTimeout {
    <T>(this: Promise<T>, delay: number, onReject?: () => void): Promise<T>
    call<T>(promise: Promise<T>, delay: number, onReject?: () => void): Promise<T>
  }
  export const pTimeout: PTimeout
}
