import assert from 'assert/strict'
import test from 'node:test'

import { acquireRpuGuard } from './_rpuGuard.mjs'

const { describe, it } = test

describe('acquireRpuGuard', function () {
  it('allows a single RPU per pool and releases the lock', function () {
    const release = acquireRpuGuard('pool-1', 'rollingPoolUpdate')
    assert.throws(() => acquireRpuGuard('pool-1', 'rollingPoolReboot'), { code: 5 /* forbiddenOperation */ })
    release()
    acquireRpuGuard('pool-1', 'rollingPoolUpdate')()
  })

  it('is independent between pools', function () {
    const release1 = acquireRpuGuard('pool-a', 'rollingPoolUpdate')
    const release2 = acquireRpuGuard('pool-b', 'rollingPoolUpdate')
    release1()
    release2()
  })
})
