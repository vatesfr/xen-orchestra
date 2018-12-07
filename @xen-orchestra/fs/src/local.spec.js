/* eslint-env jest */

import { getHandler } from '.'

let handler

beforeEach(async () => {
  handler = getHandler({ url: 'file://' + process.cwd() })
})

test("local test doesn't crash", async () => {
  const result = await handler.test()
  expect(result.success).toBeTruthy()
})
