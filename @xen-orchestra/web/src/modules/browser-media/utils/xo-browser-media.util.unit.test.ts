import {
  getBrowserMediaEndReason,
  getBrowserMediaRefusal,
  isValidIsoSize,
  parseBrowserMediaMessage,
  readBrowserMediaBlock,
} from '@/modules/browser-media/utils/xo-browser-media.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'

const FILE_SIZE = 4096

describe('parseBrowserMediaMessage', () => {
  it('recognizes the session announcement', () => {
    expect(parseBrowserMediaMessage('{"session":"0123abcd"}', FILE_SIZE)).toEqual({
      type: 'session',
      sessionId: '0123abcd',
    })
  })

  it('returns a valid read request', () => {
    expect(parseBrowserMediaMessage('{"id":3,"offset":512,"length":1024}', FILE_SIZE)).toEqual({
      type: 'read',
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
    ['an empty session id', { session: '' }],
  ])('rejects %s', (_, request) => {
    expect(() => parseBrowserMediaMessage(JSON.stringify(request), FILE_SIZE)).toThrow()
  })

  it('rejects binary messages and invalid JSON', () => {
    expect(() => parseBrowserMediaMessage(new ArrayBuffer(4), FILE_SIZE)).toThrow()
    expect(() => parseBrowserMediaMessage('not JSON', FILE_SIZE)).toThrow()
    expect(() => parseBrowserMediaMessage('null', FILE_SIZE)).toThrow()
  })
})

describe('readBrowserMediaBlock', () => {
  it('prefixes the requested bytes with the request id, big-endian', async () => {
    const file = new Blob([new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])])

    const reply = await readBrowserMediaBlock(file, { id: 0x01020304, offset: 2, length: 4 })

    expect([...reply]).toEqual([1, 2, 3, 4, 2, 3, 4, 5])
  })

  it('fails on a short read', async () => {
    const file = new Blob([new Uint8Array(4)])

    await expect(readBrowserMediaBlock(file, { id: 0, offset: 2, length: 4 })).rejects.toThrow('Short read')
  })
})

describe('isValidIsoSize', () => {
  it.each([
    [32 * 1024, true],
    [128 * 1024 ** 3, true],
    [32 * 1024 - 512, false],
    [128 * 1024 ** 3 + 512, false],
    [64 * 1024 + 1, false],
  ])('%d is %s', (size, expected) => {
    expect(isValidIsoSize(size)).toBe(expected)
  })
})

describe('getBrowserMediaEndReason', () => {
  it.each([
    [4410, 'ejected'],
    [4408, 'idle'],
    [4503, 'unavailable'],
    [4400, 'protocol'],
    [1006, 'lost'],
  ])('maps %d to %s', (code, reason) => {
    expect(getBrowserMediaEndReason(code)).toBe(reason)
  })
})

describe('getBrowserMediaRefusal', () => {
  const refusal = (data: Record<string, unknown>) =>
    getBrowserMediaRefusal(new ApiError('Conflict', { status: 409, cause: { error: 'incorrect state', data } }))

  it('recognizes the checks of xo-server', () => {
    expect(refusal({ property: 'empty', expected: true })).toBe('cd-not-empty')
    expect(refusal({ property: 'high_availability', expected: '' })).toBe('high-availability')
    expect(refusal({ property: 'power_state', expected: 'Halted' })).toBe('cd-drive-requires-halted-vm')
    expect(refusal({ property: 'power_state', expected: ['Running', 'Halted'] })).toBe('bad-power-state')
  })

  it('does not guess the others', () => {
    expect(refusal({ property: 'status', expected: 'connected' })).toBe('unknown')
    expect(getBrowserMediaRefusal(new Error('network'))).toBe('unknown')
  })
})
