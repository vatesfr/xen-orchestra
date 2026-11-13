import { createLogger } from '@xen-orchestra/log'
import { Agent, fetch as undiciFetch, type Dispatcher } from 'undici'

const log = createLogger('vates:everpure')

const DEFAULT_TIMEOUT_MS = 30_000
const SECTOR_SIZE = 512
/** First REST version with `GET /volumes/diff`. */
const MIN_API_VERSION_FOR_DIFF = 9

/** The subset of a `fetch` response the client relies on. */
export interface HttpResponseLike {
  readonly ok: boolean
  readonly status: number
  readonly statusText: string
  readonly headers: { get(name: string): string | null }
  text(): Promise<string>
}

export interface HttpRequestInit {
  readonly method: string
  readonly headers: Readonly<Record<string, string>>
  readonly body?: string
  readonly signal: AbortSignal
  readonly dispatcher?: Dispatcher
}

export type FetchFunction = (url: string, init: HttpRequestInit) => Promise<HttpResponseLike>

export interface EverpureClientOptions {
  /** Base URL of the array's management interface, e.g. `https://array.example.org`. */
  readonly url: string
  /** API token of an array user. Creating snapshots needs at least the `storage_admin` role. */
  readonly apiToken: string
  /** REST API version to use, e.g. `2.36`. Defaults to the highest 2.x version the array advertises. */
  readonly apiVersion?: string
  /** Accept the array's TLS certificate even if it is self-signed or untrusted. Defaults to false. */
  readonly allowUnauthorized?: boolean
  /** Per-request timeout, in ms. Defaults to 30000. */
  readonly timeoutMs?: number
  /** HTTP implementation, for tests. Defaults to undici's `fetch`. */
  readonly fetch?: FetchFunction
}

export interface EverpureReference {
  readonly id?: string
  readonly name: string
}

export interface EverpureVolume {
  readonly id: string
  readonly name: string
  /** SCSI serial of the volume; XCP-ng sees the LUN as `3624a9370<serial, lower-cased>`. */
  readonly serial: string
  /** Virtual size, in bytes. */
  readonly provisioned: number
  /** Creation time, in ms since the UNIX epoch. */
  readonly created: number
  /** True once destroyed and pending eradication. */
  readonly destroyed: boolean
}

export interface EverpureVolumeSnapshot extends EverpureVolume {
  /** The snapshot's name is `<source volume>.<suffix>`. */
  readonly source: EverpureReference
  readonly suffix: string
}

/** A byte range of a volume or snapshot, as returned by `GET /volumes/diff`. */
export interface EverpureBlockRange {
  readonly offset: number
  readonly length: number
}

export interface ListChangedBlocksOptions {
  /** Snapshot (`volume.suffix`) or volume whose blocks are listed. */
  readonly name: string
  /**
   * Snapshot or volume to compare against: only the blocks that differ from it
   * are listed. When omitted, every mapped (allocated) block is listed.
   */
  readonly baseName?: string
  /** Comparison granularity, in bytes: a multiple of 512. Returned ranges are aligned on it. */
  readonly blockSize: number
  /** Start of the compared area, in bytes. Multiple of `blockSize`. Defaults to 0. */
  readonly offset?: number
  /** Length of the compared area, in bytes. Defaults to the rest of the snapshot. */
  readonly length?: number
  /** The compared area is queried in segments of this many bytes. Defaults to the whole area in one segment. */
  readonly segmentLength?: number
}

export interface DeleteVolumeSnapshotResult {
  /**
   * False when the snapshot could only be destroyed, not eradicated (e.g. the
   * array's SafeMode forbids manual eradication): it then stays in the
   * eradication-pending state until the array's eradication delay elapses.
   */
  readonly eradicated: boolean
}

interface ListResponse<T> {
  readonly items: ReadonlyArray<T>
  readonly continuation_token?: string | null
  readonly more_items_remaining?: boolean
}

interface ErrorResponse {
  readonly errors?: ReadonlyArray<{ readonly message?: string; readonly context?: string }>
}

type Query = Readonly<Record<string, string | number | boolean | undefined>>

interface RequestOptions {
  readonly query?: Query
  readonly body?: unknown
  readonly retryOnUnauthorized?: boolean
}

/** An HTTP error answered by the array, with the messages of its `errors` array. */
export class EverpureError extends Error {
  readonly status: number
  readonly method: string
  readonly path: string
  readonly errors: ReadonlyArray<string>

  constructor(method: string, path: string, status: number, statusText: string, errors: ReadonlyArray<string>) {
    super(`${method} ${path}: HTTP ${status} ${errors.length > 0 ? errors.join('; ') : statusText}`)
    this.name = 'EverpureError'
    this.method = method
    this.path = path
    this.status = status
    this.errors = errors
  }
}

function assertMultipleOf(value: number, unit: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0 || value % unit !== 0) {
    throw new RangeError(`${label} must be a positive multiple of ${unit}, got ${value}`)
  }
}

function compareVersions(a: string, b: string): number {
  return Number(a.slice(2)) - Number(b.slice(2))
}

/**
 * Client for the REST API 2.x of an Everpure (Pure Storage FlashArray) array.
 *
 * Call {@link connect} before anything else: it picks the API version and
 * exchanges the API token for a session token, which is sent with every
 * request and transparently renewed once when the array answers 401.
 */
export class EverpureClient {
  readonly #url: string
  readonly #apiToken: string
  readonly #timeoutMs: number
  readonly #fetch: FetchFunction
  readonly #dispatcher?: Agent
  #apiVersion?: string
  #sessionToken?: string

  constructor(options: EverpureClientOptions) {
    this.#url = options.url.replace(/\/+$/, '')
    this.#apiToken = options.apiToken
    this.#apiVersion = options.apiVersion
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.#fetch = options.fetch ?? (undiciFetch as FetchFunction)
    if (options.allowUnauthorized === true) {
      // undici's fetch only accepts a dispatcher from the same undici copy,
      // hence undici's fetch rather than Node's global one above.
      this.#dispatcher = new Agent({ connect: { rejectUnauthorized: false } })
    }
  }

  /** The REST version in use, once connected. */
  get apiVersion(): string | undefined {
    return this.#apiVersion
  }

  async connect(): Promise<void> {
    if (this.#apiVersion === undefined) {
      this.#apiVersion = await this.#negotiateApiVersion()
    }
    await this.#login()
  }

  /** Ends the session. Safe to call when not connected. */
  async close(): Promise<void> {
    if (this.#sessionToken !== undefined) {
      try {
        await this.#request('POST', '/logout', { retryOnUnauthorized: false })
      } catch (error) {
        log.warn('logout failed, the session will expire on its own', { url: this.#url, error })
      }
      this.#sessionToken = undefined
    }
    await this.#dispatcher?.close()
  }

  // --- volumes & snapshots ---------------------------------------------------

  async getVolume(name: string): Promise<EverpureVolume> {
    return this.#getSingle<EverpureVolume>('/volumes', name)
  }

  async getVolumeSnapshot(name: string): Promise<EverpureVolumeSnapshot> {
    return this.#getSingle<EverpureVolumeSnapshot>('/volume-snapshots', name)
  }

  /** The snapshots of a volume, destroyed (eradication pending) ones included. */
  listVolumeSnapshots(volumeName: string): AsyncGenerator<EverpureVolumeSnapshot> {
    return this.#paginate<EverpureVolumeSnapshot>('/volume-snapshots', { source_names: volumeName })
  }

  /**
   * Takes a crash-consistent snapshot `<volumeName>.<suffix>` of a volume. The
   * array picks a numeric suffix when none is given.
   */
  async createVolumeSnapshot(
    volumeName: string,
    { suffix }: { readonly suffix?: string } = {}
  ): Promise<EverpureVolumeSnapshot> {
    const response = await this.#request<ListResponse<EverpureVolumeSnapshot>>('POST', '/volume-snapshots', {
      query: { source_names: volumeName },
      body: suffix === undefined ? {} : { suffix },
    })
    const snapshot = response.items[0]
    if (snapshot === undefined) {
      throw new Error(`snapshot of ${volumeName} created but the array returned no snapshot record`)
    }
    log.info('snapshot created', { volume: volumeName, snapshot: snapshot.name })
    return snapshot
  }

  /**
   * Destroys a snapshot, then eradicates it so that it stops holding space
   * right away. See {@link DeleteVolumeSnapshotResult.eradicated}.
   */
  async deleteVolumeSnapshot(name: string): Promise<DeleteVolumeSnapshotResult> {
    await this.#request('PATCH', '/volume-snapshots', { query: { names: name }, body: { destroyed: true } })
    try {
      await this.#request('DELETE', '/volume-snapshots', { query: { names: name } })
    } catch (error) {
      log.warn('snapshot destroyed but not eradicated, it will be eradicated after the array eradication delay', {
        snapshot: name,
        error,
      })
      return { eradicated: false }
    }
    log.info('snapshot deleted', { snapshot: name })
    return { eradicated: true }
  }

  // --- block maps ------------------------------------------------------------

  /**
   * The allocated blocks of a snapshot (or volume), or the blocks that changed
   * since `baseName`, as `{ offset, length }` byte ranges aligned on
   * `blockSize` and sorted by offset. Needs REST 2.9+.
   */
  async *listChangedBlocks(options: ListChangedBlocksOptions): AsyncGenerator<EverpureBlockRange> {
    const { name, baseName, blockSize } = options
    assertMultipleOf(blockSize, SECTOR_SIZE, 'blockSize')
    const start = options.offset ?? 0
    if (start !== 0) {
      assertMultipleOf(start, blockSize, 'offset')
    }
    const length = options.length ?? (await this.getVolumeSnapshot(name)).provisioned - start
    const segmentLength = options.segmentLength ?? length
    assertMultipleOf(segmentLength, blockSize, 'segmentLength')
    this.#assertDiffSupported()

    const end = start + length
    for (let segmentOffset = start; segmentOffset < end; segmentOffset += segmentLength) {
      yield* this.#paginate<EverpureBlockRange>('/volumes/diff', {
        names: name,
        base_name: baseName,
        block_size: blockSize,
        segment_offset: segmentOffset,
        segment_length: Math.min(segmentLength, end - segmentOffset),
      })
    }
  }

  #assertDiffSupported(): void {
    const version = this.#apiVersion
    if (version !== undefined && Number(version.slice(2)) < MIN_API_VERSION_FOR_DIFF) {
      throw new Error(
        `listing changed blocks needs REST API 2.${MIN_API_VERSION_FOR_DIFF}+, the array offers ${version}`
      )
    }
  }

  // --- transport -------------------------------------------------------------

  async #negotiateApiVersion(): Promise<string> {
    const response = await this.#send('GET', `${this.#url}/api/api_version`, {})
    const { version } = JSON.parse(await response.text()) as { version?: ReadonlyArray<string> }
    const highest = (version ?? [])
      .filter(v => v.startsWith('2.'))
      .sort(compareVersions)
      .at(-1)
    if (highest === undefined) {
      throw new Error(
        `${this.#url} does not offer the REST API 2.x (advertised: ${(version ?? []).join(', ') || 'none'})`
      )
    }
    log.debug('api version negotiated', { url: this.#url, version: highest })
    return highest
  }

  async #login(): Promise<void> {
    const response = await this.#send('POST', this.#apiUrl('/login'), { headers: { 'api-token': this.#apiToken } })
    const token = response.headers.get('x-auth-token')
    if (token === null) {
      throw new Error(`login to ${this.#url} succeeded but the array returned no x-auth-token header`)
    }
    this.#sessionToken = token
  }

  #apiUrl(path: string, query?: Query): string {
    if (this.#apiVersion === undefined) {
      throw new Error('EverpureClient.connect() must be called first')
    }
    const url = new URL(`${this.#url}/api/${this.#apiVersion}${path}`)
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
    return url.href
  }

  async #getSingle<T>(path: string, name: string): Promise<T> {
    const response = await this.#request<ListResponse<T>>('GET', path, { query: { names: name } })
    const item = response.items[0]
    if (item === undefined) {
      throw new Error(`no such object on ${this.#url}: ${path} ${name}`)
    }
    return item
  }

  async *#paginate<T>(path: string, query: Query): AsyncGenerator<T> {
    let continuationToken: string | undefined
    do {
      const page = await this.#request<ListResponse<T>>('GET', path, {
        query: { ...query, continuation_token: continuationToken },
      })
      yield* page.items
      continuationToken = page.continuation_token ?? undefined
    } while (continuationToken !== undefined)
  }

  /** An authenticated request to the API, with the JSON body of the response. */
  async #request<T = undefined>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const sessionToken = this.#sessionToken
    if (sessionToken === undefined) {
      throw new Error('EverpureClient.connect() must be called first')
    }
    let response: HttpResponseLike
    try {
      response = await this.#send(method, this.#apiUrl(path, options.query), {
        headers: { 'x-auth-token': sessionToken },
        body: options.body,
      })
    } catch (error) {
      if (error instanceof EverpureError && error.status === 401 && options.retryOnUnauthorized !== false) {
        log.info('session expired, logging in again', { url: this.#url })
        await this.#login()
        return this.#request<T>(method, path, { ...options, retryOnUnauthorized: false })
      }
      throw error
    }
    const text = await response.text()
    return (text === '' ? undefined : JSON.parse(text)) as T
  }

  async #send(
    method: string,
    url: string,
    { headers = {}, body }: { readonly headers?: Readonly<Record<string, string>>; readonly body?: unknown }
  ): Promise<HttpResponseLike> {
    const path = new URL(url).pathname
    let response: HttpResponseLike
    try {
      response = await this.#fetch(url, {
        method,
        headers: { accept: 'application/json', 'content-type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        // built-in cancellation of the request itself, where pTimeout would only abandon the promise
        signal: AbortSignal.timeout(this.#timeoutMs),
        dispatcher: this.#dispatcher,
      })
    } catch (error) {
      throw new Error(`${method} ${path} on ${this.#url} failed`, { cause: error })
    }
    log.debug('response', { method, path, status: response.status })
    if (!response.ok) {
      let messages: ReadonlyArray<string> = []
      const text = await response.text()
      try {
        const parsed = JSON.parse(text) as ErrorResponse
        messages = (parsed.errors ?? []).map(({ message, context }) =>
          context !== undefined && context !== '' ? `${message} (${context})` : (message ?? '')
        )
      } catch (error) {
        log.debug('non-JSON error body', { method, path, status: response.status, error })
      }
      throw new EverpureError(method, path, response.status, response.statusText, messages)
    }
    return response
  }
}
