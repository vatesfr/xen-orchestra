import { strict as assert } from 'node:assert'
import test from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'

// vdi.mjs cannot be imported alone (circular import with index.mjs)
import { Xapi } from './index.mjs'

const VDI_REF = 'OpaqueRef:vdi'
const CURRENT_SIZE = 1024
const NEW_SIZE = 2048

function xapiError(code) {
  return Object.assign(new Error(code), { code })
}

// call VDI_resize on a fake XAPI: `results` maps a XAPI method to the error it
// must throw (no entry = success), resolve with the ordered list of called methods
async function resize(size, results = {}) {
  const calledMethods = []
  const xapi = {
    // XAPI may return int64 fields as strings
    getField: async () => String(CURRENT_SIZE),
    callAsync: async (method, vdiRef, requestedSize) => {
      assert.equal(vdiRef, VDI_REF)
      assert.equal(requestedSize, size)
      calledMethods.push(method)
      if (results[method] !== undefined) {
        throw results[method]
      }
    },
  }
  await Xapi.prototype.VDI_resize.call(xapi, VDI_REF, size)
  return calledMethods
}

test('refuses a size below the current one without calling XAPI', async () => {
  await assert.rejects(resize(CURRENT_SIZE - 1), error => invalidParameters.is(error))
})

test('uses VDI.resize when it succeeds', async () => {
  assert.deepEqual(await resize(NEW_SIZE), ['VDI.resize'])
})

test('rethrows VDI.resize errors other than VDI_IN_USE without trying online', async () => {
  const srFull = xapiError('SR_FULL')
  await assert.rejects(resize(NEW_SIZE, { 'VDI.resize': srFull }), error => error === srFull)
})

test('falls back to VDI.resize_online when the VDI is in use', async () => {
  const calledMethods = await resize(NEW_SIZE, { 'VDI.resize': xapiError('VDI_IN_USE') })
  assert.deepEqual(calledMethods, ['VDI.resize', 'VDI.resize_online'])
})

for (const code of ['MESSAGE_METHOD_UNKNOWN', 'MESSAGE_REMOVED']) {
  test(`throws VDI_IN_USE when VDI.resize_online fails with ${code}`, async () => {
    const vdiInUse = xapiError('VDI_IN_USE')
    await assert.rejects(
      resize(NEW_SIZE, { 'VDI.resize': vdiInUse, 'VDI.resize_online': xapiError(code) }),
      error => error === vdiInUse
    )
  })
}

test('rethrows other VDI.resize_online errors', async () => {
  const srFull = xapiError('SR_FULL')
  await assert.rejects(
    resize(NEW_SIZE, { 'VDI.resize': xapiError('VDI_IN_USE'), 'VDI.resize_online': srFull }),
    error => error === srFull
  )
})
