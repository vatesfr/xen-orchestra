import { strict as assert } from 'node:assert'
import test from 'node:test'
import { Readable } from 'node:stream'

// import through `index.mjs`: `vdi.mjs` is part of a circular import and cannot
// be loaded as an entry point
import { Xapi } from './index.mjs'

const importContent = Xapi.prototype.VDI_importContent

// minimal fake Xapi exposing only what `importContent` uses, recording the task
// progress values it receives
function makeXapi() {
  const progresses = []
  return {
    progresses,
    call(method, _ref, value) {
      if (method === 'task.set_progress') {
        progresses.push(value)
      }
      return Promise.resolve()
    },
    getField: () => Promise.resolve('task-uuid'),
    getRecord: (type, ref) =>
      Promise.resolve(
        type === 'VDI'
          ? { SR: 'OpaqueRef:sr', name_label: 'vdi', update_other_config: () => Promise.resolve() }
          : { name_label: 'sr' }
      ),
    pool: { master: 'OpaqueRef:host' },
    putResource: (_cancelToken, content) =>
      // consume the payload like the real HTTP request does
      Buffer.isBuffer(content) ? Promise.resolve() : new Promise(resolve => content.on('end', resolve).resume()),
    task_create: () => Promise.resolve('OpaqueRef:task'),
  }
}

test('a Buffer content is imported without trying to watch its progress', async () => {
  const xapi = makeXapi()

  await importContent.call(xapi, 'OpaqueRef:vdi', Buffer.alloc(512), { format: 'raw' })

  assert.deepEqual(xapi.progresses, [])
})

test('a stream content has its progress reported', async () => {
  const xapi = makeXapi()

  await importContent.call(xapi, 'OpaqueRef:vdi', Object.assign(Readable.from([Buffer.alloc(512)]), { length: 512 }), {
    format: 'raw',
  })

  assert.equal(xapi.progresses.at(-1), 1)
})

test('a content without length is rejected', async () => {
  await assert.rejects(importContent.call(makeXapi(), 'OpaqueRef:vdi', Readable.from([]), { format: 'raw' }), /length/)
})
