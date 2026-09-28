import {
  getBrowserMediaErrorReason,
  parseBrowserMediaMessage,
  readBrowserMediaBlock,
} from '@/modules/browser-media/utils/xo-browser-media.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'

const FILE_SIZE = 4096

describe('parseBrowserMediaMessage', () => {
  it('recognizes the ready message', () => {
    expect(parseBrowserMediaMessage('{"ready":true}', FILE_SIZE)).toBe('ready')
  })

  it('returns a valid read request', () => {
    expect(parseBrowserMediaMessage('{"id":3,"offset":512,"length":1024}', FILE_SIZE)).toEqual({
      id: 3,
      offset: 512,
      length: 1024,
    })
  })

  it.each([
    ['a read past the end of the file', { id: 1, offset: 4000, length: 512 }],
    ['an empty read', { id: 1, offset: 0, length: 0 }],
    ['a read larger than 1 MiB', { id: 1, offset: 0, length: 1024 * 1024 + 1 }],
    ['a negative offset', { id: 1, offset: -1, length: 512 }],
    ['an id that does not fit in 32 bits', { id: 2 ** 32, offset: 0, length: 512 }],
    ['a missing id', { offset: 0, length: 512 }],
  ])('rejects %s', (_, request) => {
    expect(() => parseBrowserMediaMessage(JSON.stringify(request), FILE_SIZE)).toThrow('Invalid read request')
  })

  it('rejects a message that is not JSON', () => {
    expect(() => parseBrowserMediaMessage('not JSON', FILE_SIZE)).toThrow()
  })
})

describe('readBrowserMediaBlock', () => {
  const file = new Blob([Uint8Array.from({ length: FILE_SIZE }, (_, index) => index % 256)])

  it('prefixes the requested bytes with the request id as a big-endian uint32', async () => {
    const reply = await readBrowserMediaBlock(file, { id: 0x01020304, offset: 256, length: 4 })

    expect(Array.from(reply)).toEqual([1, 2, 3, 4, 0, 1, 2, 3])
  })

  it('rejects a read the file cannot fully answer', async () => {
    await expect(readBrowserMediaBlock(file, { id: 1, offset: FILE_SIZE - 2, length: 4 })).rejects.toThrow('Short read')
  })
})

describe('getBrowserMediaErrorReason', () => {
  const incorrectState = (data: Record<string, unknown>) =>
    new ApiError('Conflict', { status: 409, cause: { error: 'incorrect state', data } })

  it('recognizes a CD drive which is not empty', () => {
    expect(getBrowserMediaErrorReason(incorrectState({ property: 'empty', actual: false, expected: true }))).toBe(
      'cd-not-empty'
    )
  })

  it('recognizes a running VM without a plugged CD drive', () => {
    expect(
      getBrowserMediaErrorReason(incorrectState({ property: 'power_state', actual: 'Running', expected: 'Halted' }))
    ).toBe('cd-drive-requires-halted-vm')
  })

  it('does not interpret other errors', () => {
    expect(getBrowserMediaErrorReason(incorrectState({ property: 'status' }))).toBe('unknown')
    expect(getBrowserMediaErrorReason(new Error('network error'))).toBe('unknown')
  })
})
