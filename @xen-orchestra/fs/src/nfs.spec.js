/* eslint-env jest */

import { getHandler } from '.'

let handler

beforeEach(async () => {
  handler = getHandler({
    url: 'nfs://ip:/tmp/test',
    type: 'nfs',
    host: 'ip',
    port: undefined,
    path: '/tmp/test',
    id: '12345',
  })
})

test("nfs test doesn't crash", async () => {
  const result = await handler.test()
  expect(result.success).toBeTruthy()
})

test('call _mount method when _sync is called', async () => {
  handler._mount = jest.fn()
  await handler._sync()
  expect(handler._mount).toHaveBeenCalled()
})

test('call _umount method when _forget is called', async () => {
  handler._umount = jest.fn()
  await handler._forget()
  expect(handler._umount).toHaveBeenCalled()
})
