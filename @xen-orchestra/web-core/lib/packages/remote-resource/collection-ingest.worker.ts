import type { IngestFormat, IngestRequest, IngestResponse } from '@core/packages/remote-resource/ingest-worker.types.ts'
import readNDJSONStream from 'ndjson-readablestream'

// Web Worker that fetches and parses a resource off the main thread, then streams the result
// back. NDJSON collections are parsed line-by-line and sent in batches (so a large collection
// never blocks the UI with a single giant `JSON.parse`); plain JSON resources are parsed with
// `response.json()` and sent in one message.

// Minimal view of the dedicated worker scope, declared locally to avoid mixing the DOM and
// WebWorker TS libs (which both declare `postMessage` with incompatible signatures).
interface WorkerScope {
  postMessage(message: IngestResponse): void
  addEventListener(type: 'message', listener: (event: MessageEvent<IngestRequest>) => void): void
}

const worker = self as unknown as WorkerScope

const BATCH_SIZE = 5_000

const controllers = new Map<number, AbortController>()

function post(message: IngestResponse) {
  worker.postMessage(message)
}

async function load(requestId: number, url: string, format: IngestFormat) {
  const controller = new AbortController()
  controllers.set(requestId, controller)

  try {
    const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal })

    if (!response.ok) {
      post({ type: 'error', requestId, message: `Failed to fetch: ${response.statusText}` })

      return
    }

    if (format === 'json') {
      const value = await response.json()

      post({ type: 'json', requestId, value })
      post({ type: 'done', requestId, total: Array.isArray(value) ? value.length : 1 })

      return
    }

    if (response.body === null) {
      post({ type: 'error', requestId, message: 'Failed to fetch: empty response body' })

      return
    }

    let batch: unknown[] = []
    let total = 0

    for await (const record of readNDJSONStream(response.body)) {
      batch.push(record)
      total += 1

      if (batch.length >= BATCH_SIZE) {
        post({ type: 'batch', requestId, records: batch })
        batch = []
      }
    }

    if (batch.length > 0) {
      post({ type: 'batch', requestId, records: batch })
    }

    post({ type: 'done', requestId, total })
  } catch (error) {
    if (!controller.signal.aborted) {
      post({ type: 'error', requestId, message: error instanceof Error ? error.message : String(error) })
    }
  } finally {
    controllers.delete(requestId)
  }
}

worker.addEventListener('message', event => {
  const request = event.data

  if (request.type === 'abort') {
    controllers.get(request.requestId)?.abort()
    controllers.delete(request.requestId)

    return
  }

  void load(request.requestId, request.url, request.format)
})
