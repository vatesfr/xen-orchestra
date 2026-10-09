// Docker attach/logs stream decoding.
//
// When a container has no TTY, dockerd multiplexes stdout and stderr on the
// same HTTP body (`Content-Type: application/vnd.docker.multiplexed-stream`):
// each frame is an 8-byte header `[streamType, 0, 0, 0, size (uint32 BE)]`
// followed by `size` bytes of payload. With a TTY, the body is the raw output
// (`application/vnd.docker.raw-stream`), stdout and stderr merged.
//
// See https://docs.docker.com/reference/api/engine/version/v1.43/#tag/Container/operation/ContainerAttach

import { StringDecoder } from 'node:string_decoder'
import { Transform, type TransformCallback } from 'node:stream'
import type { XoDockerLogEntry } from '@vates/types'

import { compareApiVersions } from './connection.mjs'
import { DOCKER_API_ERROR, DockerError } from './errors.mjs'

export const MULTIPLEXED_STREAM_CONTENT_TYPE = 'application/vnd.docker.multiplexed-stream'
export const RAW_STREAM_CONTENT_TYPE = 'application/vnd.docker.raw-stream'

const HEADER_SIZE = 8

// stream type (1st byte of a frame header) → stream name
//
// type 3 (`systemErr`) is used by dockerd to report an error in the middle of
// an attach/exec stream, its payload is the error message
const STREAM_NAMES = ['stdin', 'stdout', 'stderr'] as const
const SYSTEM_ERR = 3
// only the beginning of a systemErr payload is kept (it becomes an error
// message), the rest is read and dropped
export const MAX_SYSTEM_ERR_SIZE = 64 * 1024

export type DockerStreamName = (typeof STREAM_NAMES)[number]

/** object emitted by `createStdcopyDemuxer()` */
export type DemuxedChunk = { stream: DockerStreamName; chunk: Buffer }

/** `createStdcopyDemuxer()` */
export type StdcopyDemuxer = Transform & { truncated: boolean }

/**
 * Object emitted by `createLogLineParser()`: an `XoDockerLogEntry`, except
 * that `stream` may be `stdin` (attach streams), and that `timestamp` is always
 * present (`undefined` if the line has none).
 */
export type DockerLogLine = Omit<XoDockerLogEntry, 'stream' | 'timestamp'> & {
  stream: DockerStreamName
  timestamp: string | undefined
}

/**
 * Whether a logs/attach response body is multiplexed (8-byte frames) or raw.
 *
 * The `Content-Type` is reliable since API 1.42. With older API versions (or
 * an unknown one), a `raw-stream` content type is not conclusive and the
 * container's `Config.Tty` decides, defaulting to multiplexed, which is what
 * containers without TTY (the vast majority) produce.
 *
 * @param contentType response `Content-Type`
 * @param tty `Config.Tty` of the container, if known
 * @param apiVersion negotiated API version, e.g. `1.44`
 */
export function isMultiplexedStream(contentType: string | undefined, tty?: boolean, apiVersion?: string): boolean {
  const type = contentType?.split(';')[0].trim().toLowerCase()
  if (type === MULTIPLEXED_STREAM_CONTENT_TYPE) {
    return true
  }
  if (type === RAW_STREAM_CONTENT_TYPE && apiVersion !== undefined && compareApiVersions(apiVersion, '1.42') >= 0) {
    return false
  }
  return tty !== true
}

/**
 * Transform stream: Docker logs/attach body (bytes) → `{ stream, chunk }`
 * objects, `stream` being `stdout`, `stderr` or `stdin`, and `chunk` a
 * `Buffer`.
 *
 * Frames can be split across any chunk boundary. Payloads are emitted as soon as
 * they arrive, so a big frame is never buffered entirely: consumers must not
 * assume one object per frame (see `createLogLineParser()`).
 *
 * If the input ends in the middle of a frame, the payload received so far has
 * already been emitted and `demuxer.truncated` is set to `true`: the stream ends
 * normally, so that the complete part of the logs remains usable.
 *
 * @param opts.tty raw mode: the input is not framed, every chunk is emitted as `stdout`
 */
export function createStdcopyDemuxer({ tty = false }: { tty?: boolean } = {}): StdcopyDemuxer {
  if (tty) {
    // `truncated` is added right below
    const passthrough = new Transform({
      readableObjectMode: true,
      transform(chunk: Buffer, _encoding, callback) {
        callback(null, { stream: 'stdout', chunk } satisfies DemuxedChunk)
      },
    }) as StdcopyDemuxer
    passthrough.truncated = false
    return passthrough
  }

  const header = Buffer.alloc(HEADER_SIZE)
  let headerLength = 0
  let stream: DockerStreamName | undefined // name of the stream of the current frame
  let remaining = 0 // payload bytes still expected for the current frame
  let systemErr: Buffer[] | undefined // chunks of a systemErr frame, emitted as an error
  let systemErrSize = 0

  // `truncated` is added right below
  const demuxer = new Transform({
    readableObjectMode: true,

    transform(chunk: Buffer, _encoding, callback) {
      let offset = 0
      const { length } = chunk
      while (offset < length) {
        if (remaining === 0) {
          // reading a header
          const n = Math.min(HEADER_SIZE - headerLength, length - offset)
          chunk.copy(header, headerLength, offset, offset + n)
          headerLength += n
          offset += n
          if (headerLength < HEADER_SIZE) {
            break
          }
          headerLength = 0

          const type = header[0]
          remaining = header.readUInt32BE(4)
          if (type === SYSTEM_ERR) {
            systemErr = []
            systemErrSize = 0
          } else if (type < STREAM_NAMES.length) {
            stream = STREAM_NAMES[type]
          } else {
            callback(
              new DockerError(DOCKER_API_ERROR, `invalid Docker stream: unknown stream type ${type}`, {
                data: { header: header.toString('hex') },
              })
            )
            return
          }
          if (remaining === 0 && systemErr !== undefined) {
            callback(systemError(systemErr))
            return
          }
          continue
        }

        // reading a payload
        const n = Math.min(remaining, length - offset)
        // subarray() does not copy: chunks come from the socket and are not reused
        const payload = chunk.subarray(offset, offset + n)
        offset += n
        remaining -= n
        if (systemErr !== undefined) {
          if (systemErrSize < MAX_SYSTEM_ERR_SIZE) {
            const kept = payload.subarray(0, MAX_SYSTEM_ERR_SIZE - systemErrSize)
            systemErr.push(kept)
            systemErrSize += kept.length
          }
          if (remaining === 0) {
            callback(systemError(systemErr))
            return
          }
        } else {
          // `stream!`: set by the header of this frame
          this.push({ stream: stream!, chunk: payload } satisfies DemuxedChunk)
        }
      }
      callback()
    },

    flush(callback) {
      if (headerLength !== 0 || remaining !== 0) {
        ;(this as StdcopyDemuxer).truncated = true
      }
      callback()
    },
  }) as StdcopyDemuxer
  demuxer.truncated = false
  return demuxer
}

function systemError(chunks: Buffer[]): DockerError {
  return new DockerError(DOCKER_API_ERROR, `Docker stream error: ${Buffer.concat(chunks).toString().trim()}`)
}

// RFC3339Nano timestamp as prefixed by dockerd with `timestamps=1`, e.g.
// `2026-09-24T16:54:37.796330221Z` (trailing zeros of the fraction are
// trimmed, the fraction can be missing, the offset is `Z` in practice)
const TIMESTAMP_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})) /

const DEFAULT_MAX_LINE_LENGTH = 64 * 1024

/**
 * Transform stream (object mode): `{ stream, chunk }` objects (from
 * `createStdcopyDemuxer()`) → `{ stream, timestamp, message }` log entries.
 *
 * - lines are split on `\n`, a trailing `\r` (TTY output) is removed
 * - each stream is buffered separately, so interleaved stdout/stderr chunks do
 *   not mix partial lines
 * - `timestamp` is the RFC3339Nano string prefixed by dockerd with
 *   `timestamps=1`, kept verbatim (it has a nanosecond precision), or
 *   `undefined` if the line has none
 * - a line longer than `maxLineLength` characters is split, which bounds the
 *   memory used by an output without new lines
 * - the last line is emitted even if it does not end with a new line
 *
 * The input chunks may also be strings.
 */
export function createLogLineParser({
  maxLineLength = DEFAULT_MAX_LINE_LENGTH,
}: { maxLineLength?: number } = {}): Transform {
  // stream name → { decoder, pending }
  const states = new Map<DockerStreamName, { decoder: StringDecoder; pending: string }>()
  const getState = (stream: DockerStreamName) => {
    let state = states.get(stream)
    if (state === undefined) {
      state = { decoder: new StringDecoder('utf8'), pending: '' }
      states.set(stream, state)
    }
    return state
  }

  const emitLine = (parser: Transform, stream: DockerStreamName, line: string) => {
    if (line.endsWith('\r')) {
      line = line.slice(0, -1)
    }
    const match = TIMESTAMP_RE.exec(line)
    parser.push(
      (match === null
        ? { stream, timestamp: undefined, message: line }
        : { stream, timestamp: match[1], message: line.slice(match[0].length) }) satisfies DockerLogLine
    )
  }

  return new Transform({
    objectMode: true,

    transform(
      { stream, chunk }: { stream: DockerStreamName; chunk: Buffer | string },
      _encoding: BufferEncoding,
      callback: TransformCallback
    ) {
      const state = getState(stream)
      const text = state.pending + (typeof chunk === 'string' ? chunk : state.decoder.write(chunk))
      const lines = text.split('\n')
      // `pop()!`: `split()` gives at least one string
      let pending = lines.pop()!
      for (const line of lines) {
        emitLine(this, stream, line)
      }
      while (pending.length > maxLineLength) {
        emitLine(this, stream, pending.slice(0, maxLineLength))
        pending = pending.slice(maxLineLength)
      }
      state.pending = pending
      callback()
    },

    flush(callback) {
      for (const [stream, state] of states) {
        const last = state.pending + state.decoder.end()
        if (last !== '') {
          emitLine(this, stream, last)
        }
      }
      states.clear()
      callback()
    },
  })
}
