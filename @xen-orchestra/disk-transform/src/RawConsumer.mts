/**
 * Byte-level random-access interface for a disk image.
 * Implementations provide arbitrary-offset reads over a raw disk
 * (e.g. a reconstructed VHD chain, a qcow2 file, …).
 */
export interface RawConsumer {
  uuid: string
  init(): Promise<void>
  close(): Promise<void>
  read(start: number, length: number): Promise<Buffer>
  size(): number
}
