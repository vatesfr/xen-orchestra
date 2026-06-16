// Message contract shared between the ingestion worker and its main-thread client.

// 'ndjson' streams a line-delimited collection back in batches; 'json' parses the whole
// response with `response.json()` and returns the parsed value (array or object) in one message.
export type IngestFormat = 'ndjson' | 'json'

export interface IngestLoadRequest {
  type: 'load'
  requestId: number
  url: string
  format: IngestFormat
}

export interface IngestAbortRequest {
  type: 'abort'
  requestId: number
}

export type IngestRequest = IngestLoadRequest | IngestAbortRequest

export interface IngestBatchResponse {
  type: 'batch'
  requestId: number
  records: unknown[]
}

export interface IngestJsonResponse {
  type: 'json'
  requestId: number
  value: unknown
}

export interface IngestDoneResponse {
  type: 'done'
  requestId: number
  total: number
}

export interface IngestErrorResponse {
  type: 'error'
  requestId: number
  message: string
}

export type IngestResponse = IngestBatchResponse | IngestJsonResponse | IngestDoneResponse | IngestErrorResponse
