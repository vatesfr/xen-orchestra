import type { IngestFormat, IngestRequest, IngestResponse } from '@core/packages/remote-resource/ingest-worker.types.ts'

// Main-thread client for the ingestion worker. A single worker is shared across all resources;
// concurrent loads are distinguished by `requestId`. `loadCollectionViaWorker` resolves when the
// worker is done and rejects on error, so callers can `await` it like a fetch.

export interface IngestOptions {
  format: IngestFormat
  onBatch?: (records: unknown[]) => void
  onJson?: (value: unknown) => void
  signal?: AbortSignal
}

interface IngestHandlers {
  onBatch?: (records: unknown[]) => void
  onJson?: (value: unknown) => void
  onDone: () => void
  onError: (message: string) => void
}

let worker: Worker | undefined

let nextRequestId = 1

const handlersByRequest = new Map<number, IngestHandlers>()

function getWorker(): Worker {
  if (worker === undefined) {
    worker = new Worker(new URL('./collection-ingest.worker.ts', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (event: MessageEvent<IngestResponse>) => {
      const response = event.data
      const handlers = handlersByRequest.get(response.requestId)

      if (handlers === undefined) {
        return
      }

      if (response.type === 'batch') {
        handlers.onBatch?.(response.records)

        return
      }

      if (response.type === 'json') {
        handlers.onJson?.(response.value)

        return
      }

      if (response.type === 'done') {
        handlers.onDone()
      } else {
        handlers.onError(response.message)
      }

      handlersByRequest.delete(response.requestId)
    })
  }

  return worker
}

export function loadCollectionViaWorker(url: string, options: IngestOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const instance = getWorker()
    const requestId = nextRequestId

    nextRequestId += 1

    handlersByRequest.set(requestId, {
      onBatch: options.onBatch,
      onJson: options.onJson,
      onDone: resolve,
      onError: message => reject(new Error(message)),
    })

    const loadRequest: IngestRequest = { type: 'load', requestId, url, format: options.format }
    instance.postMessage(loadRequest)

    options.signal?.addEventListener('abort', () => {
      const abortRequest: IngestRequest = { type: 'abort', requestId }
      instance.postMessage(abortRequest)
      handlersByRequest.delete(requestId)
      resolve()
    })
  })
}
