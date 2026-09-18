import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'

import { _createTemplate, _downloadBaseVDI, _installXenGuestAgent } from './_hubKubernetesCluster.mjs'

const disk = Buffer.from('base disk contents')
const checksum = createHash('sha512').update(disk).digest('hex')

function mockDownloads(t, failure) {
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.endsWith('/SHA512SUMS')) {
      if (failure === 'checksum') throw new Error('checksum unavailable')
      return new Response(
        `${failure === 'mismatch' ? 'invalid' : checksum}  debian-13-genericcloud-amd64-20260601-2496.raw\n`
      )
    }
    if (failure === 'download') throw new Error('download unavailable')
    return new Response(disk, { headers: { 'Content-Length': String(disk.length) } })
  })
}

// Simulate only the XAPI operations used by template creation and record their order.
class FakeXapi {
  constructor(failures = []) {
    this.calls = []
    this.errors = Object.fromEntries(failures.map(stage => [stage, new Error(`${stage} failed`)]))
    this.barriers = 0
    this.vdi = {
      $destroy: () => this.step('destroy base'),
      $importContent: stream => this.importContent(stream),
    }
    this.vm = {
      $ref: 'vm-ref',
      $id: 'vm-id',
      VBDs: [],
      $destroy: () => this.step('destroy vm'),
      set_is_a_template: () => this.step('set template'),
    }
    this.cloudConfigVdi = { $destroy: () => this.step('destroy cloud') }
  }

  async step(stage) {
    this.calls.push(stage)
    if (this.errors[stage] !== undefined) throw this.errors[stage]
  }

  async importContent(stream) {
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    assert.deepEqual(Buffer.concat(chunks), disk)
    await this.step('import')
  }

  async VDI_create() {
    await this.step('create disk')
    return 'base-ref'
  }

  async call(method, ref) {
    assert.equal(method, 'VDI.destroy')
    assert.equal(ref, 'base-ref')
    await this.step('destroy base')
  }

  async _getOrWaitObject(ref) {
    if (ref === 'cloud-uuid') return this.cloudConfigVdi
    assert.equal(ref, 'base-ref')
    await this.step('get disk')
    return this.vdi
  }

  async createVm() {
    await this.step('create vm')
    return this.vm
  }

  async barrier() {
    await this.step(++this.barriers === 1 ? 'initial barrier' : 'final barrier')
    return this.vm
  }

  async VBD_create() {
    await this.step('attach')
  }

  async VM_createCloudInitConfig() {
    await this.step('create cloud')
    return 'cloud-uuid'
  }

  async startVm() {
    await this.step('start')
  }

  async _waitObjectState() {
    await this.step('wait')
  }

  async shutdownVm() {
    await this.step('shutdown')
  }
}

for (const { stage, expectedCleanup, expectedError } of [
  {
    stage: 'create disk',
    expectedCleanup: [],
    expectedError: { message: /Failed to create VDI/, cause: new Error('create disk failed') },
  },
  {
    stage: 'get disk',
    expectedCleanup: ['destroy base'],
    expectedError: { message: /Failed to get created VDI/, cause: new Error('get disk failed') },
  },
  {
    stage: 'download',
    expectedCleanup: ['destroy base'],
    expectedError: { message: /Failed to download base disk/, cause: new Error('download unavailable') },
  },
  {
    stage: 'import',
    expectedCleanup: ['destroy base'],
    expectedError: { message: /Failed to download base disk/, cause: new Error('import failed') },
  },
  {
    stage: 'checksum',
    expectedCleanup: ['destroy base'],
    expectedError: { message: /Failed to get remote checksum/, cause: new Error('checksum unavailable') },
  },
  {
    stage: 'mismatch',
    expectedCleanup: ['destroy base'],
    expectedError: { message: /Checksum mismatch for the downloaded disk/ },
  },
]) {
  test(`base disk cleanup after ${stage} failure`, async t => {
    mockDownloads(t, stage)
    const xapi = new FakeXapi([stage])
    const { calls } = xapi
    await assert.rejects(_downloadBaseVDI(xapi, {}, 'disk'), expectedError)
    assert.deepEqual(
      calls.filter(call => call === 'destroy base'),
      expectedCleanup
    )
  })
}

test('successful base disk import preserves the VDI', async t => {
  mockDownloads(t)
  const xapi = new FakeXapi()
  const { vdi, calls } = xapi
  assert.equal(await _downloadBaseVDI(xapi, {}, 'disk'), vdi)
  assert.ok(!calls.includes('destroy base'))
})

test('lookup and cleanup failures remain accessible through the template error', async () => {
  const xapi = new FakeXapi(['get disk', 'destroy base'])
  const { errors } = xapi
  await assert.rejects(_createTemplate({}, xapi, {}, 'network', {}), error => {
    assert.match(error.message, /Failed to download and import the base VDI/)
    assert.equal(error.cause.cause.cause, errors['get disk'])
    assert.equal(error.cause.errors[0].cause, errors['destroy base'])
    return true
  })
})

test('cloud-init creation failure is propagated without attempting cleanup', async () => {
  const xapi = new FakeXapi(['create cloud'])
  const { vm, calls, errors } = xapi
  await assert.rejects(_installXenGuestAgent(xapi, vm, {}), error => {
    assert.equal(error, errors['create cloud'])
    return true
  })
  assert.deepEqual(calls, ['create cloud'])
})

for (const { stage, expectedCalls } of [
  { stage: 'start', expectedCalls: ['create cloud', 'start', 'destroy cloud'] },
  { stage: 'wait', expectedCalls: ['create cloud', 'start', 'wait', 'shutdown', 'destroy cloud'] },
]) {
  test(`guest agent cleanup after ${stage} failure`, async () => {
    const xapi = new FakeXapi([stage])
    const { vm, calls, errors } = xapi
    await assert.rejects(_installXenGuestAgent(xapi, vm, {}), error => {
      assert.equal(error.cause, errors[stage])
      return true
    })
    assert.deepEqual(calls, expectedCalls)
  })
}

for (const stage of ['shutdown', 'destroy cloud']) {
  test(`guest agent reports ${stage} failure and attempts all cleanups`, async () => {
    const xapi = new FakeXapi([stage])
    const { vm, calls, errors } = xapi
    await assert.rejects(_installXenGuestAgent(xapi, vm, {}), error => {
      assert.equal(error.errors.length, 1)
      assert.equal(error.errors[0].cause, errors[stage])
      return true
    })
    assert.deepEqual(calls, ['create cloud', 'start', 'wait', 'shutdown', 'destroy cloud'])
  })
}

test('successful guest agent installation shuts down before destroying cloud-init', async () => {
  const xapi = new FakeXapi()
  const { vm, calls } = xapi
  await _installXenGuestAgent(xapi, vm, {})
  assert.deepEqual(calls, ['create cloud', 'start', 'wait', 'shutdown', 'destroy cloud'])
})

test('all guest agent cleanups run and preserve the readiness failure and both cleanup failures', async () => {
  const xapi = new FakeXapi(['wait', 'shutdown', 'destroy cloud'])
  const { vm, calls, errors } = xapi
  await assert.rejects(_installXenGuestAgent(xapi, vm, {}), error => {
    assert.equal(error.cause.cause, errors.wait)
    assert.deepEqual(
      error.errors.map(error => error.cause),
      [errors.shutdown, errors['destroy cloud']]
    )
    return true
  })
  assert.deepEqual(calls.slice(-2), ['shutdown', 'destroy cloud'])
})

for (const { stage, expectedCleanup, expectedError } of [
  {
    stage: 'create vm',
    expectedCleanup: ['destroy base'],
    expectedError: /Failed to create template VM/,
  },
  {
    stage: 'initial barrier',
    expectedCleanup: ['destroy vm', 'destroy base'],
    expectedError: /Failed to destroy all disks of the template VM/,
  },
  {
    stage: 'attach',
    expectedCleanup: ['destroy vm', 'destroy base'],
    expectedError: /Failed to attach VDI to VM/,
  },
  {
    stage: 'wait',
    expectedCleanup: ['destroy vm', 'destroy base'],
    expectedError: /Failed to install Xen Guest Agent/,
  },
  {
    stage: 'set template',
    expectedCleanup: ['destroy vm', 'destroy base'],
    expectedError: /Failed to set VM as template/,
  },
  {
    stage: 'final barrier',
    expectedCleanup: ['destroy vm', 'destroy base'],
    expectedError: /final barrier failed/,
  },
]) {
  test(`template resources are cleaned up after ${stage} failure`, async t => {
    mockDownloads(t)
    const xapi = new FakeXapi([stage])
    const { calls } = xapi
    await assert.rejects(_createTemplate({}, xapi, {}, 'network', {}), expectedError)
    assert.deepEqual(
      calls.filter(call => ['destroy vm', 'destroy base'].includes(call)),
      expectedCleanup
    )
  })
}

test('successful template creation preserves the template and its base disk', async t => {
  mockDownloads(t)
  const xapi = new FakeXapi()
  const { vm, calls } = xapi
  assert.equal(await _createTemplate({}, xapi, {}, 'network', {}), vm)
  assert.deepEqual(
    calls.filter(call => call.startsWith('destroy ')),
    ['destroy cloud']
  )
})

test('VM cleanup failure does not prevent disk cleanup or mask the attachment failure', async t => {
  mockDownloads(t)
  const xapi = new FakeXapi(['attach', 'destroy vm', 'destroy base'])
  const { calls, errors } = xapi
  await assert.rejects(_createTemplate({}, xapi, {}, 'network', {}), error => {
    assert.equal(error.cause.cause, errors.attach)
    assert.deepEqual(
      error.errors.map(error => error.cause),
      [errors['destroy vm'], errors['destroy base']]
    )
    return true
  })
  assert.deepEqual(calls.slice(-2), ['destroy vm', 'destroy base'])
})
