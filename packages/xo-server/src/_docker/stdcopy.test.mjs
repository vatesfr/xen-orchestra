import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import test from 'node:test'

import { DOCKER_API_ERROR } from './errors.mjs'
import { LOGS_EXITED, LOGS_NGINX, LOGS_TTY } from './fixtures/logs.mjs'
import {
  createLogLineParser,
  createStdcopyDemuxer,
  isMultiplexedStream,
  MAX_SYSTEM_ERR_SIZE,
  MULTIPLEXED_STREAM_CONTENT_TYPE,
  RAW_STREAM_CONTENT_TYPE,
} from './stdcopy.mjs'

const { describe, it } = test

const NGINX_BODY = Buffer.from(LOGS_NGINX.body, 'base64')
const EXITED_BODY = Buffer.from(LOGS_EXITED.body, 'base64')
const TTY_BODY = Buffer.from(LOGS_TTY.body, 'base64')

function frame(type, payload) {
  const data = Buffer.from(payload)
  const header = Buffer.alloc(8)
  header[0] = type
  header.writeUInt32BE(data.length, 4)
  return Buffer.concat([header, data])
}

const bytes = buffer => Array.from(buffer, byte => Buffer.from([byte]))

async function run(chunks, ...transforms) {
  const output = []
  await pipeline(Readable.from(chunks), ...transforms, async source => {
    for await (const object of source) {
      output.push(object)
    }
  })
  return output
}

// concatenates the emitted chunks of each stream
function byStream(objects) {
  const result = {}
  for (const { stream, chunk } of objects) {
    result[stream] = Buffer.concat([result[stream] ?? Buffer.alloc(0), chunk])
  }
  return Object.fromEntries(Object.entries(result).map(([stream, buffer]) => [stream, buffer.toString()]))
}

// splits a multiplexed body into frames, the simple way
function parseFrames(body) {
  const frames = []
  for (let offset = 0; offset < body.length; ) {
    const size = body.readUInt32BE(offset + 4)
    frames.push({ type: body[offset], payload: body.subarray(offset + 8, offset + 8 + size).toString() })
    offset += 8 + size
  }
  return frames
}

describe('createStdcopyDemuxer()', () => {
  it('demuxes the real logs of a container, fed at once', async () => {
    const objects = await run([EXITED_BODY], createStdcopyDemuxer())
    assert.deepEqual(
      objects.map(({ stream, chunk }) => ({ stream, text: chunk.toString() })),
      [{ stream: 'stdout', text: '2026-09-24T16:54:38.377173968Z failing on purpose\n' }]
    )
  })

  it('demuxes real logs fed byte-at-a-time', async () => {
    const frames = parseFrames(NGINX_BODY)
    const expected = {
      stdout: frames
        .filter(_ => _.type === 1)
        .map(_ => _.payload)
        .join(''),
      stderr: frames
        .filter(_ => _.type === 2)
        .map(_ => _.payload)
        .join(''),
    }
    assert.ok(expected.stdout.length > 0 && expected.stderr.length > 0)

    const demuxer = createStdcopyDemuxer()
    const objects = await run(bytes(NGINX_BODY), demuxer)
    assert.deepEqual(byStream(objects), expected)
    assert.equal(demuxer.truncated, false)
    for (const { chunk } of objects) {
      assert.ok(Buffer.isBuffer(chunk))
    }
  })

  it('handles a frame boundary at any position', async () => {
    const body = Buffer.concat([
      frame(1, 'out 1\n'),
      frame(2, 'err 1\n'),
      frame(1, ''),
      frame(1, 'out 2\n'),
      frame(0, 'in\n'),
    ])
    for (let i = 0; i <= body.length; ++i) {
      for (let j = i; j <= body.length; j += 3) {
        const chunks = [body.subarray(0, i), body.subarray(i, j), body.subarray(j)].filter(_ => _.length !== 0)
        assert.deepEqual(byStream(await run(chunks, createStdcopyDemuxer())), {
          stdout: 'out 1\nout 2\n',
          stderr: 'err 1\n',
          stdin: 'in\n',
        })
      }
    }
  })

  it('keeps the order of interleaved stdout and stderr frames', async () => {
    const body = Buffer.concat([frame(1, 'a'), frame(2, 'b'), frame(1, 'c'), frame(2, 'd')])
    const objects = await run(bytes(body), createStdcopyDemuxer())
    assert.deepEqual(
      objects.map(({ stream, chunk }) => stream + ':' + chunk),
      ['stdout:a', 'stderr:b', 'stdout:c', 'stderr:d']
    )
  })

  it('emits big payloads without waiting for the end of the frame', async () => {
    const payload = Buffer.alloc(1024 * 1024, 'x')
    const body = frame(1, payload)
    const chunks = [body.subarray(0, 1000), body.subarray(1000, 500e3), body.subarray(500e3)]
    const objects = await run(chunks, createStdcopyDemuxer())
    assert.equal(objects.length, 3)
    assert.equal(Buffer.concat(objects.map(_ => _.chunk)).length, payload.length)
  })

  describe('truncated trailing frame', () => {
    const [firstFrameSize] = [8 + NGINX_BODY.readUInt32BE(4)]

    it('in the payload: emits what was received and sets `truncated`', async () => {
      const cut = firstFrameSize + 8 + 10
      const demuxer = createStdcopyDemuxer()
      const objects = await run(bytes(NGINX_BODY.subarray(0, cut)), demuxer)
      assert.equal(demuxer.truncated, true)
      const text = Buffer.concat(objects.map(_ => _.chunk)).toString()
      assert.equal(text.length, firstFrameSize - 8 + 10)
      assert.ok(text.startsWith(NGINX_BODY.subarray(8, firstFrameSize).toString()))
    })

    it('in the header: drops the partial header and sets `truncated`', async () => {
      const demuxer = createStdcopyDemuxer()
      const objects = await run([NGINX_BODY.subarray(0, firstFrameSize + 5)], demuxer)
      assert.equal(demuxer.truncated, true)
      assert.equal(
        Buffer.concat(objects.map(_ => _.chunk)).toString(),
        NGINX_BODY.subarray(8, firstFrameSize).toString()
      )
    })
  })

  it('fails on an unknown stream type', async () => {
    await assert.rejects(run([Buffer.concat([frame(1, 'ok'), frame(7, 'ko')])], createStdcopyDemuxer()), {
      code: DOCKER_API_ERROR,
      message: /unknown stream type 7/,
    })
  })

  it('fails with the message of a systemErr frame', async () => {
    await assert.rejects(run(bytes(Buffer.concat([frame(1, 'ok'), frame(3, 'boom\n')])), createStdcopyDemuxer()), {
      code: DOCKER_API_ERROR,
      message: 'Docker stream error: boom',
    })
  })

  it('keeps only the first MAX_SYSTEM_ERR_SIZE bytes of a systemErr payload', async () => {
    const payload = 'x'.repeat(MAX_SYSTEM_ERR_SIZE) + 'DROPPED'.repeat(1e4)
    const big = frame(3, payload)
    // split in several chunks: the cap spans chunks
    const chunks = []
    for (let i = 0; i < big.length; i += 10e3) {
      chunks.push(big.subarray(i, i + 10e3))
    }
    await assert.rejects(run(chunks, createStdcopyDemuxer()), error => {
      assert.equal(error.code, DOCKER_API_ERROR)
      assert.equal(error.message, 'Docker stream error: ' + 'x'.repeat(MAX_SYSTEM_ERR_SIZE))
      return true
    })
  })

  it('passes raw (TTY) streams through as stdout', async () => {
    const demuxer = createStdcopyDemuxer({ tty: true })
    const objects = await run(bytes(TTY_BODY), demuxer)
    assert.equal(objects.length, TTY_BODY.length)
    assert.deepEqual(byStream(objects), { stdout: TTY_BODY.toString() })
    assert.equal(demuxer.truncated, false)
  })
})

describe('createLogLineParser()', () => {
  it('parses real non-TTY logs, fed byte-at-a-time', async () => {
    const entries = await run(bytes(NGINX_BODY), createStdcopyDemuxer(), createLogLineParser())
    const frames = parseFrames(NGINX_BODY)
    // with timestamps=1, dockerd sends one line per frame
    assert.equal(entries.length, frames.length)
    entries.forEach((entry, i) => {
      assert.equal(entry.stream, frames[i].type === 1 ? 'stdout' : 'stderr')
      assert.equal(`${entry.timestamp} ${entry.message}\n`, frames[i].payload)
      assert.match(entry.timestamp, /^2026-09-24T16:5\d:\d\d\.\d+Z$/)
    })
    assert.deepEqual(entries[0], {
      stream: 'stdout',
      timestamp: '2026-09-24T16:54:37.796330221Z',
      message: '/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration',
    })
    assert.ok(entries.some(_ => _.stream === 'stderr' && _.message.includes('[notice]')))
    assert.ok(entries.some(_ => _.stream === 'stdout' && _.message.includes('"GET / HTTP/1.1" 200')))
  })

  it('parses real TTY logs: strips \\r, emits the last line without new line', async () => {
    const entries = await run(bytes(TTY_BODY), createStdcopyDemuxer({ tty: true }), createLogLineParser())
    assert.deepEqual(entries, [
      { stream: 'stdout', timestamp: '2026-09-24T16:56:05.110355030Z', message: 'tty line one' },
      // written on stderr by the container, but a TTY merges both
      { stream: 'stdout', timestamp: '2026-09-24T16:56:05.110988999Z', message: 'tty line two' },
      { stream: 'stdout', timestamp: '2026-09-24T16:56:05.170603899Z', message: 'no newline at end' },
    ])
  })

  it('buffers partial lines per stream', async () => {
    const body = Buffer.concat([
      frame(1, 'hel'),
      frame(2, 'err '),
      frame(1, 'lo\nwor'),
      frame(2, 'line\n'),
      frame(1, 'ld'),
    ])
    const entries = await run([body], createStdcopyDemuxer(), createLogLineParser())
    assert.deepEqual(entries, [
      { stream: 'stdout', timestamp: undefined, message: 'hello' },
      { stream: 'stderr', timestamp: undefined, message: 'err line' },
      { stream: 'stdout', timestamp: undefined, message: 'world' },
    ])
  })

  it('extracts the leading RFC3339Nano timestamp', async () => {
    const lines = [
      '2026-09-24T16:54:37.796330221Z message',
      '2026-09-24T16:54:37.7Z trimmed fraction',
      '2026-09-24T16:54:37Z no fraction',
      '2026-09-24T18:54:37.123+02:00 offset',
      '2026-09-24T16:54:37.796330221Z ',
      'no timestamp',
      '2026-09-24T16:54:37Z',
      ' 2026-09-24T16:54:37Z leading space',
    ]
    const entries = await run([{ stream: 'stdout', chunk: Buffer.from(lines.join('\n')) }], createLogLineParser())
    assert.deepEqual(
      entries.map(({ timestamp, message }) => [timestamp, message]),
      [
        ['2026-09-24T16:54:37.796330221Z', 'message'],
        ['2026-09-24T16:54:37.7Z', 'trimmed fraction'],
        ['2026-09-24T16:54:37Z', 'no fraction'],
        ['2026-09-24T18:54:37.123+02:00', 'offset'],
        ['2026-09-24T16:54:37.796330221Z', ''],
        [undefined, 'no timestamp'],
        [undefined, '2026-09-24T16:54:37Z'],
        [undefined, ' 2026-09-24T16:54:37Z leading space'],
      ]
    )
  })

  it('keeps empty lines', async () => {
    const entries = await run([{ stream: 'stdout', chunk: Buffer.from('a\n\n\nb\n') }], createLogLineParser())
    assert.deepEqual(
      entries.map(_ => _.message),
      ['a', '', '', 'b']
    )
  })

  it('decodes multi-byte UTF-8 characters split across chunks', async () => {
    const text = 'héllo wörld 🐳\n'
    const chunks = bytes(Buffer.from(text)).map(chunk => ({ stream: 'stdout', chunk }))
    const entries = await run(chunks, createLogLineParser())
    assert.deepEqual(entries, [{ stream: 'stdout', timestamp: undefined, message: 'héllo wörld 🐳' }])
  })

  it('splits lines longer than maxLineLength', async () => {
    const chunks = [
      { stream: 'stdout', chunk: Buffer.from('x'.repeat(25)) },
      { stream: 'stdout', chunk: 'yy\nz' },
    ]
    const entries = await run(chunks, createLogLineParser({ maxLineLength: 10 }))
    assert.deepEqual(
      entries.map(_ => _.message),
      ['x'.repeat(10), 'x'.repeat(10), 'xxxxxyy', 'z']
    )
  })
})

describe('isMultiplexedStream()', () => {
  it('trusts the content type since API 1.42', () => {
    assert.equal(isMultiplexedStream(LOGS_NGINX.contentType, undefined, '1.43'), true)
    assert.equal(isMultiplexedStream(LOGS_TTY.contentType, undefined, '1.43'), false)
    assert.equal(isMultiplexedStream(RAW_STREAM_CONTENT_TYPE, false, '1.42'), false)
    assert.equal(isMultiplexedStream(`${MULTIPLEXED_STREAM_CONTENT_TYPE}; charset=utf-8`, true, '1.24'), true)
  })

  it('falls back to Config.Tty before API 1.42, or when the content type is unknown', () => {
    assert.equal(isMultiplexedStream(RAW_STREAM_CONTENT_TYPE, false, '1.41'), true)
    assert.equal(isMultiplexedStream(RAW_STREAM_CONTENT_TYPE, true, '1.41'), false)
    assert.equal(isMultiplexedStream(undefined, true, '1.43'), false)
    assert.equal(isMultiplexedStream('text/plain', false), true)
    // defaults to multiplexed, like most containers
    assert.equal(isMultiplexedStream(undefined, undefined), true)
  })
})
