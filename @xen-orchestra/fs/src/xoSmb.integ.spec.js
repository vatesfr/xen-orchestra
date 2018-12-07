/* eslint-env jest */

import { getHandler } from '.'

const remoteId = 'test'
let handler

beforeEach(async () => {
  handler = getHandler({
    url: 'smb://login:pass@WORKGROUP\\\\ip\\smb\u0000',
    id: remoteId,
    type: 'smb',
  })
})

afterEach(async () => {
  await handler._umount()
})

test("smb._mount() doesn't crash", async () => {
  const mount = await handler._mount()
  expect(mount.failed).toBe(false)
})
