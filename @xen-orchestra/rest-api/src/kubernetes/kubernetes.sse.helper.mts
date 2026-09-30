import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:rest-api:kubernetes-sse')

export type SseEvent = {
  event: string
  data: unknown
}

const MAX_BUFFER_LENGTH = 1e6

export function createSseParser() {
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName: string | undefined
  let dataLines: string[] = []

  function push(chunk: Uint8Array): SseEvent[] {
    const events: SseEvent[] = []

    buffer += decoder.decode(chunk, { stream: true })

    if (buffer.length > MAX_BUFFER_LENGTH) {
      log.warn(`SSE buffer exceeded memory limiy (1 MiB)`)

      buffer = ''
      eventName = ''
      dataLines = []
    }

    drain(events)

    return events
  }

  function end(): SseEvent[] {
    const events: SseEvent[] = []

    buffer += decoder.decode()

    if (buffer !== '') {
      buffer += '\n'
    }

    drain(events)
    dispatch(events)

    return events
  }

  function dispatch(events: SseEvent[]) {
    // an empty line ends the event being received: emit it and start a new one
    if (dataLines.length > 0) {
      // the data of an event can be split across several `data:` lines
      const payload = dataLines.join('\n')

      try {
        events.push({ event: eventName ?? 'message', data: JSON.parse(payload) })
      } catch (error) {
        // a malformed event must not break the stream
        log.warn(`Malformed event: ${payload.substring(0, 20)}`)
      }
    }

    eventName = undefined
    dataLines = []
  }

  function drain(events: SseEvent[]) {
    let i: number
    while ((i = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, i)
      buffer = buffer.slice(i + 1)

      if (line.endsWith('\r')) {
        line = line.substring(0, line.length - 1)
      }

      if (line.length == 0) {
        dispatch(events)
        continue
      }

      // a line starting with a colon is a comment, which some servers use as heartbeat
      if (line.startsWith(':')) {
        continue
      }

      const colonIndex = line.indexOf(':')
      const field = colonIndex === -1 ? line : line.slice(0, colonIndex)
      let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1)

      // a single space after the colon is part of the syntax, not of the value
      if (value.startsWith(' ')) {
        value = value.slice(1)
      }

      if (field === 'event') {
        eventName = value
      } else if (field === 'data') {
        dataLines.push(value)
      }
      // `id` and `retry` are ignored: resuming a stream is not supported
    }
  }

  return { push, end }
}
