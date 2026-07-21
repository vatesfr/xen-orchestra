import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { buildRunContext, buildVmContext, buildSrContext, buildRemoteContext } from './_buildContext.mjs'

describe('buildContext', () => {
  const date = new Date('2025-01-05T03:00:00Z')
  const runContext = buildRunContext(date, 'America/New_York')
  const expectedRunContext = {
    dayOfWeek: 6,
    dayOfMonth: 4,
    hour: 22,
    month: 1,
    year: 2025,
  }

  it('buildRunContext', () => {
    assert.deepEqual(runContext, expectedRunContext)
  })

  it('buildVmContext', () => {
    const vm1 = { name: 'name', $value: '$value', func: () => {} }
    const vmContext1 = buildVmContext(vm1, runContext, 3)
    assert.deepEqual(vmContext1, {
      vm: {
        name: 'name',
        tags: [],
      },
      run: expectedRunContext,
      chainLength: 3,
    })

    const vm2 = { name: 'name', $value: '$value', func: () => {}, tags: ['tag'] }
    const vmContext2 = buildVmContext(vm2, runContext, undefined)
    assert.deepEqual(vmContext2, {
      vm: {
        name: 'name',
        tags: ['tag'],
      },
      run: expectedRunContext,
      chainLength: undefined,
    })

    const vm3 = { name: 'name', $value: '$value', func: () => {}, tags: 'tag' }
    const vmContext3 = buildVmContext(vm3, runContext, undefined)
    assert.deepEqual(vmContext3, {
      vm: {
        name: 'name',
        tags: [],
      },
      run: expectedRunContext,
      chainLength: undefined,
    })
  })

  it('buildSrContext', () => {
    const sr1 = {
      name_label: 'name_label',
      type: 'type',
      description: 'description',
      ignored: 'ignored',
    }
    const srContext1 = buildSrContext(sr1, runContext)
    assert.deepEqual(srContext1, {
      sr: {
        name_label: 'name_label',
        type: 'type',
        description: 'description',
        tags: [],
      },
      run: expectedRunContext,
    })

    const sr2 = {
      name_label: 'name_label',
      type: 'type',
      description: 'description',
      tags: ['tag'],
      ignored: 'ignored',
    }
    const srContext2 = buildSrContext(sr2, runContext)
    assert.deepEqual(srContext2, {
      sr: {
        name_label: 'name_label',
        type: 'type',
        description: 'description',
        tags: ['tag'],
      },
      run: expectedRunContext,
    })
  })

  it('buildRemoteContext', () => {
    const remote1 = {
      name: 'name',
      type: 'type',
      ignored: 'ignored',
    }
    const remoteContext1 = buildRemoteContext(remote1, runContext)
    assert.deepEqual(remoteContext1, {
      remote: {
        name: 'name',
        type: 'type',
        tags: [],
      },
      run: expectedRunContext,
    })

    const remote2 = {
      name: 'name',
      type: 'type',
      tags: ['tag'],
      ignored: 'ignored',
    }
    const remoteContext2 = buildRemoteContext(remote2, runContext)
    assert.deepEqual(remoteContext2, {
      remote: {
        name: 'name',
        type: 'type',
        tags: ['tag'],
      },
      run: expectedRunContext,
    })
  })
})
