// Bounded requests built on a connection: container logs and the raw API
// passthrough. No XO concepts here: the caller validates the parameters,
// provides the limits and maps the errors (e.g. 404).

import { once } from 'node:events'
import type { IncomingHttpHeaders, IncomingMessage } from 'node:http'
import { type Readable, Transform } from 'node:stream'
import { finished } from 'node:stream/promises'
import type { XoDockerLogEntry, XoDockerLogs } from '@vates/types'

import { compareApiVersions, type DockerConnection } from './connection.mjs'
import { DOCKER_API_ERROR, DockerError, RAW_REQUEST_TOO_LARGE, RAW_RESPONSE_TOO_LARGE } from './errors.mjs'
import { normalizeContainerInspect } from './normalize.mjs'
import { createLogLineParser, createStdcopyDemuxer, isMultiplexedStream } from './stdcopy.mjs'
import type { DockerInspect } from './wire.mjs'

type Connection = Pick<DockerConnection, 'apiVersion' | 'request' | 'requestStream'>

export type ContainerLogsOptions = {
  /** number of lines from the end */
  tail: number
  /** Docker timestamp (seconds since the epoch, fractional part allowed) */
  since?: string
  /** Docker timestamp (seconds since the epoch, fractional part allowed) */
  until?: string
  stdout?: boolean
  stderr?: boolean
  timestamps?: boolean
  /** `Config.Tty` of the container if known, only used before API 1.42 (else inspected) */
  tty?: boolean
  /** max bytes read from the response, `truncated` above */
  maxSize: number
  /** max entries returned (dockerd splits lines over 64 KiB), `truncated` above */
  maxEntries: number
  /** max duration of the whole read (ms), `truncated` and `timedOut` above */
  timeout: number
  /** max duration without data (ms), `truncated` and `timedOut` above */
  idleTimeout: number
}

/**
 * Logs of a container, bounded in size, entries and time: on expiry, what has
 * been read so far is returned.
 *
 * @throws {DockerError} e.g. DOCKER_API_ERROR with `data.statusCode` 404 for an unknown container
 */
export async function readContainerLogs(
  connection: Connection,
  dockerId: string,
  {
    tail,
    since,
    until,
    stdout = true,
    stderr = true,
    timestamps = true,
    tty,
    maxSize,
    maxEntries,
    timeout,
    idleTimeout,
  }: ContainerLogsOptions
): Promise<XoDockerLogs> {
  const path = `/containers/${encodeURIComponent(dockerId)}`
  const query = {
    // dockerd answers 400 without any of them: always ask for both, and
    // filter afterwards
    stdout: 1,
    stderr: 1,
    // always requested: without them, a message starting with something
    // looking like a timestamp would be mangled by the line parser
    timestamps: 1,
    tail,
    since,
    until,
  }

  // the content type is only reliable from API 1.42, before that the TTY
  // setting of the container decides
  if (connection.apiVersion === undefined || compareApiVersions(connection.apiVersion, '1.42') < 0) {
    if (tty === undefined) {
      const { body } = await connection.request({ path: path + '/json' })
      try {
        tty = normalizeContainerInspect(body as DockerInspect).tty
      } catch (error) {
        throw new DockerError(DOCKER_API_ERROR, 'invalid answer from the Docker daemon', { cause: error })
      }
    }
  } else {
    tty = undefined
  }

  const asOf = Date.now()
  const controller = new AbortController()

  // the body is bounded in time too: dockerd may stall or trickle, which
  // would keep the connection busy forever
  const TIMED_OUT = new Error('logs deadline')
  const ENOUGH = new Error('enough log entries')
  let timedOut = false
  let response: IncomingMessage | undefined
  const expire = () => {
    timedOut = true
    if (response === undefined) {
      controller.abort(new DOMException('Docker logs request timed out', 'TimeoutError'))
    } else {
      response.destroy(TIMED_OUT)
    }
  }
  const deadline = setTimeout(expire, timeout)
  let idleTimer: NodeJS.Timeout | undefined
  const resetIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(expire, idleTimeout)
  }

  try {
    response = await connection.requestStream({ path: path + '/logs', query, signal: controller.signal })
    // not reassigned below, for the closures
    const body = response
    resetIdle()

    const demuxer = createStdcopyDemuxer({
      tty: !isMultiplexedStream(body.headers['content-type'], tty, connection.apiVersion),
    })
    const parser = createLogLineParser()
    const entries: XoDockerLogEntry[] = []
    const streams = new Set([stdout && 'stdout', stderr && 'stderr'])
    demuxer.pipe(parser)
    demuxer.on('error', error => {
      parser.destroy(error)
      // interrupts the read loop below
      body.destroy(error)
    })
    let tooManyEntries = false
    const collected = (async () => {
      for await (const entry of parser) {
        if (!streams.has(entry.stream) || tooManyEntries) {
          continue
        }
        if (entries.length === maxEntries) {
          tooManyEntries = true
          // stops the read loop below, what is still in the parser is
          // drained (and dropped)
          body.destroy(ENOUGH)
          continue
        }
        entries.push(timestamps ? entry : { ...entry, timestamp: undefined })
      }
    })()
    // awaited below, avoids an unhandled rejection meanwhile
    collected.catch(() => {})

    let truncated = false
    try {
      let size = 0
      for await (const chunk of body) {
        resetIdle()
        if (size + chunk.length > maxSize) {
          demuxer.write(chunk.subarray(0, maxSize - size))
          truncated = true
          break
        }
        size += chunk.length
        if (!demuxer.write(chunk)) {
          // rejects if the demuxer fails (e.g. invalid frame)
          await once(demuxer, 'drain')
        }
      }
    } catch (error) {
      if (error !== TIMED_OUT && error !== ENOUGH) {
        throw error
      }
    } finally {
      clearTimeout(idleTimer)
      // stops reading the response (and frees the channel) when truncated or
      // timed out
      body.destroy()
      controller.abort()
      demuxer.end()
    }
    await collected
    return { entries, truncated: truncated || tooManyEntries || timedOut || demuxer.truncated, timedOut, asOf }
  } finally {
    clearTimeout(deadline)
    clearTimeout(idleTimer)
  }
}

/**
 * Pass-through stream which fails with a DockerError of `code` once more than
 * `maxSize` bytes went through.
 */
function createSizeLimiter(maxSize: number, code: string, message: string): Transform {
  let size = 0
  return new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length
      if (size > maxSize) {
        callback(new DockerError(code, message, { data: { maxSize } }))
      } else {
        callback(null, chunk)
      }
    },
  })
}

export type RawRequestOptions = {
  method: string
  /** with its query string, prefixed with the negotiated API version unless it starts with `/v<version>/` */
  path: string
  /** sent as is */
  headers?: Record<string, string>
  body?: Readable
  /** aborts the request and the response */
  signal?: AbortSignal
  /** the request body fails with RAW_REQUEST_TOO_LARGE above */
  maxRequestSize: number
  /** RAW_RESPONSE_TOO_LARGE above: thrown if announced by `content-length`, else the response body fails */
  maxResponseSize: number
  /** whole request, response body included (ms), 0 disables it */
  timeout: number
}

export type RawResponse = {
  statusCode: number
  headers: IncomingHttpHeaders
  body: Readable
  /** resolves once the response body is done (consumed, failed or destroyed), never rejects */
  done: Promise<void>
}

/**
 * Raw Docker Engine API request (passthrough): sent on a dedicated channel
 * (outside of the limit of concurrent requests), error responses are returned.
 *
 * On failure, the request body is not sent and what is still received from it
 * is discarded: it is neither destroyed nor left piped.
 *
 * @throws {DockerError}
 */
export async function rawRequest(
  connection: Connection,
  { method, path, headers = {}, body, signal, maxRequestSize, maxResponseSize, timeout }: RawRequestOptions
): Promise<RawResponse> {
  // the whole lifetime of the request, response body included (e.g. `/events`
  // or `logs?follow=1` would otherwise stay open as long as the client)
  const controller = new AbortController()
  const timer =
    timeout > 0
      ? setTimeout(
          () => controller.abort(new DOMException('raw Docker API request timed out', 'TimeoutError')),
          timeout
        )
      : undefined
  timer?.unref()
  const requestSignal = AbortSignal.any([controller.signal, signal].filter(signal => signal !== undefined))

  let requestBody: Transform | undefined
  if (body !== undefined) {
    const limiter = (requestBody = createSizeLimiter(
      maxRequestSize,
      RAW_REQUEST_TOO_LARGE,
      'the request body is too large (docker.maxRawRequestSize)'
    ))
    body.on('error', error => limiter.destroy(error))
    body.pipe(limiter)
  }
  try {
    const response = await connection.requestStream({
      method,
      path,
      headers,
      body: requestBody,
      signal: requestSignal,
      raw: true,
      longLived: true,
    })
    const length = response.headers['content-length']
    if (length !== undefined && Number(length) > maxResponseSize) {
      response.destroy()
      throw new DockerError(RAW_RESPONSE_TOO_LARGE, 'the response is too large (docker.maxRawResponseSize)', {
        data: { maxSize: maxResponseSize, statusCode: response.statusCode },
      })
    }
    const limited = createSizeLimiter(
      maxResponseSize,
      RAW_RESPONSE_TOO_LARGE,
      'the response is too large (docker.maxRawResponseSize)'
    )
    response.on('error', error => limited.destroy(error))
    limited.on('close', () => response.destroy())
    response.pipe(limited)
    return {
      // always set on a client response
      statusCode: response.statusCode!,
      headers: response.headers,
      body: limited,
      done: finished(limited).then(
        () => clearTimeout(timer),
        () => clearTimeout(timer)
      ),
    }
  } catch (error) {
    clearTimeout(timer)
    if (requestBody !== undefined) {
      body!.unpipe(requestBody)
      requestBody.destroy()
      body!.resume()
    }
    throw error
  }
}
