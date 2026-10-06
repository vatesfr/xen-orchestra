import assert from 'node:assert'
import { pRetry, pDelay, pTimeout, pFromCallback, TimeoutError } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import { createLogger } from '@xen-orchestra/log'
import {
  INIT_PASSWD,
  NBD_CMD_DISC,
  NBD_CMD_FLUSH,
  NBD_CMD_READ,
  NBD_CMD_TRIM,
  NBD_CMD_WRITE,
  NBD_CMD_WRITE_ZEROES,
  NBD_DEFAULT_BLOCK_SIZE,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_FLAG_READ_ONLY,
  NBD_FLAG_SEND_FLUSH,
  NBD_FLAG_SEND_TRIM,
  NBD_FLAG_SEND_WRITE_ZEROES,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_REPLY_ACK,
  NBD_REPLY_MAGIC,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
} from './constants.mjs'

const { debug, warn } = createLogger('vates:nbd-client')

// documentation is here : https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md

// what is received once a connection can't be parsed anymore is written there, then ignored
const DISCARD_BUFFER = Buffer.alloc(64 * 1024)

// error codes of the protocol, the same values as the Linux errno
const NBD_ERRORS = {
  1: 'EPERM',
  5: 'EIO',
  12: 'ENOMEM',
  22: 'EINVAL',
  28: 'ENOSPC',
  75: 'EOVERFLOW',
  95: 'ENOTSUP',
  108: 'ESHUTDOWN',
}

/**
 * The server refused a request, the connection is still usable
 *
 * @param {number} nbdError
 */
function createServerError(nbdError) {
  const code = NBD_ERRORS[nbdError]
  const error = new Error(`the NBD server answered the error ${nbdError} (${code ?? 'unknown'})`)
  error.code = code
  error.nbdError = nbdError
  return error
}

/**
 * A pair of streams carrying the NBD protocol.
 *
 * For a TCP client both are the same socket, for a client talking to a server
 * through its standard streams they are the two ends of two different pipes.
 *
 * @typedef {object} NbdTransport
 * @property {import('node:stream').Readable} readable - where the server answers are read from
 * @property {import('node:stream').Writable} writable - where the client queries are written to
 * @property {(receiver: (chunk: Buffer, length: number) => void) => void} [setReceiver] - optional: after the
 *  handshake, the transport hands the received data directly to `receiver` instead of emitting it through
 *  `readable` (no allocation per chunk). `chunk` may be reused once `receiver` returns: it must be consumed
 *  synchronously. Data still buffered in `readable` must be handed to `receiver` first.
 * @property {(receiver: {nextReadTarget(): Buffer, received(length: number): void, feed(chunk: Buffer, length: number): void}) => void} [setDirectReceiver]
 *  - optional, preferred to `setReceiver`: after the handshake, the transport writes each received data straight
 *  into the buffer given by `receiver.nextReadTarget()` (the rest of a header, or of the payload of a read, no copy),
 *  then calls `receiver.received(length)`. Data still buffered in `readable` must be handed to `receiver.feed()` first.
 */

/**
 * Parses the answers of the transmission phase of one connection, and copies
 * their payload straight into the buffer of the matching query.
 *
 * One receiver per connection: data received late on a previous connection
 * can't be mixed with the queries of the current one.
 *
 * Only simple replies are expected: with a payload for NBD_CMD_READ, without for
 * the other commands.
 */
class ReplyReceiver {
  // AFAIK, there is no guaranty the server answers in the same order as the queries
  // map of command waiting for a response queryId => { size/*in byte*/, target, resolve, reject}
  #backlog = new Map()
  #header = Buffer.alloc(16)
  #headerLength = 0

  /** @type {{ query: object, buffer: Buffer, filled: number } | undefined} */
  #current

  /** @type {Error | undefined} once failed, the stream can't be parsed anymore */
  #error

  #messageTimeout
  /** @type {NodeJS.Timeout | undefined} */
  #timer

  constructor(messageTimeout) {
    this.#messageTimeout = messageTimeout
  }

  get error() {
    return this.#error
  }

  add(queryId, query) {
    if (this.#error !== undefined) {
      query.reject(this.#error)
      return
    }
    this.#backlog.set(queryId, query)
    this.#watch()
  }

  delete(queryId) {
    this.#backlog.delete(queryId)
    this.#watch()
  }

  // reject everything pending and stop parsing: the next answers are not trustworthy anymore
  fail(error) {
    if (this.#error === undefined) {
      this.#error = error
    }
    const current = this.#current
    this.#current = undefined
    current?.query.reject(error)
    this.#backlog.forEach(({ reject }) => reject(error))
    this.#backlog.clear()
    this.#watch()
  }

  /**
   * @param {Buffer} chunk
   * @param {number} length - only the first `length` bytes of `chunk` are data
   */
  feed(chunk, length) {
    let offset = 0
    while (offset < length && this.#error === undefined) {
      const current = this.#current
      if (current === undefined) {
        const n = Math.min(16 - this.#headerLength, length - offset)
        chunk.copy(this.#header, this.#headerLength, offset, offset + n)
        this.#headerLength += n
        offset += n
        if (this.#headerLength === 16) {
          this.#headerLength = 0
          this.#onHeader()
        }
      } else {
        const n = Math.min(current.buffer.length - current.filled, length - offset)
        chunk.copy(current.buffer, current.filled, offset, offset + n)
        current.filled += n
        offset += n
        if (current.filled === current.buffer.length) {
          this.#current = undefined
          current.query.resolve(current.buffer)
        }
      }
    }
    this.#watch()
  }

  /**
   * Direct reception (see NbdTransport#setDirectReceiver): where the next received bytes must be written, the rest
   * of the header being received or the rest of the payload, straight into the buffer of its query
   *
   * @returns {Buffer} never empty
   */
  nextReadTarget() {
    if (this.#error !== undefined) {
      // the stream can't be parsed anymore: what comes is discarded
      return DISCARD_BUFFER
    }
    const current = this.#current
    return current === undefined ? this.#header.subarray(this.#headerLength) : current.buffer.subarray(current.filled)
  }

  /**
   * Direct reception: `length` bytes have been written into the buffer returned by nextReadTarget()
   *
   * @param {number} length
   */
  received(length) {
    if (this.#error === undefined) {
      const current = this.#current
      if (current === undefined) {
        this.#headerLength += length
        if (this.#headerLength === 16) {
          this.#headerLength = 0
          this.#onHeader()
        }
      } else {
        current.filled += length
        if (current.filled === current.buffer.length) {
          this.#current = undefined
          current.query.resolve(current.buffer)
        }
      }
    }
    this.#watch()
  }

  #onHeader() {
    const header = this.#header
    const magic = header.readInt32BE(0)
    if (magic !== NBD_REPLY_MAGIC) {
      this.fail(new Error(`magic number for block answer is wrong : ${magic} ${NBD_REPLY_MAGIC}`))
      return
    }

    const error = header.readInt32BE(4)
    const queryId = header.readBigUInt64BE(8)
    const query = this.#backlog.get(queryId)
    if (error !== 0) {
      if (query?.noPayload) {
        // nothing follows the header: only this query failed, the next answers can still be parsed
        this.#backlog.delete(queryId)
        query.reject(createServerError(error))
        return
      }
      // a simple reply to a read does not tell if its data follow: the stream can't be parsed anymore
      this.fail(new Error(`GOT ERROR CODE  : ${error}`))
      return
    }

    if (query === undefined) {
      this.fail(new Error(` no query associated with id ${queryId}`))
      return
    }
    this.#backlog.delete(queryId)
    if (query.noPayload) {
      query.resolve()
      return
    }
    // the payload is written once, at its final place
    const buffer = query.target ?? Buffer.allocUnsafe(query.size)
    if (buffer.length === 0) {
      query.resolve(buffer)
    } else {
      this.#current = { query, buffer, filled: 0 }
    }
  }

  // the server must make progress while some queries are waiting for their answer
  #watch() {
    const waiting = this.#current !== undefined || this.#backlog.size > 0
    if (!waiting) {
      clearTimeout(this.#timer)
      this.#timer = undefined
    } else if (this.#timer === undefined) {
      this.#timer = setTimeout(() => {
        this.#timer = undefined
        this.fail(new TimeoutError())
      }, this.#messageTimeout)
    } else {
      this.#timer.refresh()
    }
  }
}

/**
 * Transport agnostic NBD client: it implements the handshake and the
 * transmission phases, and delegates the opening/closing of the underlying
 * streams to its subclasses.
 *
 * Subclasses MUST implement `_openTransport()` and MAY override
 * `_secureTransport()`, `_closeTransport()`, `_destroyTransport()` and `getMap()`.
 *
 * @abstract
 */
export default class AbstractNbdClient {
  #exportName
  #exportSize
  #transmissionFlags = 0

  /** @type {NbdTransport|undefined} */
  #transport

  // incremented on each connection attempt: an attempt which is not the last
  // one anymore has been superseded (its caller timed out on it) and must not
  // publish itself
  #connectGeneration = 0

  #waitBeforeReconnect
  #readBlockRetries
  #reconnectRetry
  #connectTimeout
  #messageTimeout

  #nextCommandQueryId = BigInt(0)
  /** @type {ReplyReceiver|undefined} parses the answers of the current connection */
  #receiver
  #connected = false

  #reconnectingPromise

  /**
   * @param {object} settings
   * @param {string} [settings.exportname] - the NBD export to open, empty for the default one
   * @param {object} [options]
   * @param {number} [options.connectTimeout]
   * @param {number} [options.messageTimeout]
   * @param {number} [options.waitBeforeReconnect]
   * @param {number} [options.readBlockRetries] - tries of a read or a write, reconnecting between them
   * @param {number} [options.reconnectRetry]
   */
  constructor(
    { exportname = '' },
    {
      connectTimeout = 6e4,
      messageTimeout = 6e4,
      waitBeforeReconnect = 1e3,
      readBlockRetries = 5,
      reconnectRetry = 5,
    } = {}
  ) {
    this.#exportName = exportname
    this.#waitBeforeReconnect = waitBeforeReconnect
    this.#readBlockRetries = readBlockRetries
    this.#reconnectRetry = reconnectRetry
    this.#connectTimeout = connectTimeout
    this.#messageTimeout = messageTimeout
  }

  get exportSize() {
    return this.#exportSize
  }

  get exportName() {
    return this.#exportName
  }

  // the capabilities announced by the server for this export, known once connected
  get readOnly() {
    return (this.#transmissionFlags & NBD_FLAG_READ_ONLY) !== 0
  }

  get canFlush() {
    return (this.#transmissionFlags & NBD_FLAG_SEND_FLUSH) !== 0
  }

  get canTrim() {
    return (this.#transmissionFlags & NBD_FLAG_SEND_TRIM) !== 0
  }

  get canWriteZeroes() {
    return (this.#transmissionFlags & NBD_FLAG_SEND_WRITE_ZEROES) !== 0
  }

  get connected() {
    return this.#connected
  }

  /* ---------------------------------------------------------------------------
   * transport, to be implemented by the subclasses
   * ------------------------------------------------------------------------- */

  /**
   * Open the streams used to talk to the NBD server.
   *
   * Called on every (re)connection: it must be able to open a brand new
   * transport each time it is called.
   *
   * @abstract
   * @returns {Promise<NbdTransport>}
   */
  async _openTransport() {
    throw new Error(`${this.constructor.name} must implement _openTransport()`)
  }

  /**
   * Hook called during the handshake, after the client flags have been sent and
   * before the export is selected: this is the only moment where the transport
   * can be upgraded (NBD_OPT_STARTTLS).
   *
   * Returning another transport than the one received replaces it, returning
   * the same one is a no-op.
   *
   * @param {NbdTransport} transport
   * @returns {Promise<NbdTransport>}
   */
  async _secureTransport(transport) {
    return transport
  }

  /**
   * Gracefully close the transport.
   *
   * `lastMessage` is a ready to send NBD_CMD_DISC: implementations must hand it
   * over to the server (it is the only clean way to tell it we're done) before
   * closing their side.
   *
   * Failing or timing out here is not fatal: `_destroyTransport()` will be
   * called as a fallback.
   *
   * @param {NbdTransport} transport
   * @param {Buffer} lastMessage
   * @returns {Promise<void>}
   */
  async _closeTransport(transport, lastMessage) {
    await pFromCallback(cb => transport.writable.end(lastMessage, cb))
  }

  /**
   * Forcefully release the transport and everything backing it.
   *
   * Must be idempotent, and must not throw.
   *
   * @param {NbdTransport} transport
   * @returns {void}
   */
  _destroyTransport(transport) {
    transport.readable.destroy()
    if (transport.writable !== transport.readable) {
      transport.writable.destroy()
    }
  }

  /**
   * Returns the map of the file with holes, zeros and data, useful to handle
   * efficiently sparse sources.
   *
   * The base implementation is unable to compute it: subclasses able to do so
   * must override this method.
   *
   * To implement this here: use structured replies if the server supports them,
   * and then ask for BLOCK_STATUS.
   *
   * @returns {Promise<{ offset: number, length: number, type: number }[]>}
   * A promise that resolves to an array where each object represents a segment:
   * - `offset` — The byte offset from the start.
   * - `length` — The size of the segment in bytes.
   * - `type` — A numeric code indicating the segment type ( 0 means data).
   */
  async getMap() {
    const error = new Error(`${this.constructor.name} does not support getMap()`)
    error.code = 'NBD_MAP_UNSUPPORTED'
    throw error
  }

  /* ---------------------------------------------------------------------------
   * connection
   * ------------------------------------------------------------------------- */

  #onTransportError(error, receiver) {
    // without this listener an error on the transport would be thrown as an
    // uncaught exception, and pending reads would only fail on message timeout
    //
    // an error outside of the connected window is expected (the other end can
    // be gone already while we're closing), and always reported to the caller
    // through the connect()/readBlock() rejection
    const log = this.#connected ? warn : debug
    log('error on the nbd transport', { error })
    receiver.fail(error)
  }

  #watchTransport(transport, receiver) {
    const onError = error => this.#onTransportError(error, receiver)
    transport.readable.on('error', onError)
    if (transport.writable !== transport.readable) {
      transport.writable.on('error', onError)
    }
  }

  // transmission phase: the answers are parsed as they come, without waiting for a read() of their size
  #startReceiving(transport, receiver) {
    const onClose = () => {
      const error = new Error('the nbd transport has been closed')
      error.code = 'NBD_TRANSPORT_CLOSED'
      receiver.fail(error)
    }
    transport.readable.on('end', onClose)
    transport.readable.on('close', onClose)
    if (transport.writable !== transport.readable) {
      transport.writable.on('close', onClose)
    }

    if (transport.setDirectReceiver !== undefined) {
      transport.setDirectReceiver(receiver)
    } else if (transport.setReceiver !== undefined) {
      transport.setReceiver((chunk, length) => receiver.feed(chunk, length))
    } else {
      transport.readable.on('data', chunk => receiver.feed(chunk, chunk.length))
      // the handshake used read() with 'readable' listeners: explicitly switch the stream to flowing
      transport.readable.resume()
    }
  }

  async #connect() {
    const generation = ++this.#connectGeneration
    // the transport is kept local until the client is connected: connect() does
    // not cancel on timeout, so a superseded attempt must not be able to use,
    // replace or destroy the transport of the attempt which replaced it
    let transport = await this._openTransport()
    // each connection has its own receiver: late answers on a previous one can't reach the queries of this one
    const receiver = new ReplyReceiver(this.#messageTimeout)
    this.#watchTransport(transport, receiver)
    try {
      // the transport can be replaced during the handshake (TLS upgrade)
      transport = await this.#handshake(transport, receiver)

      if (generation !== this.#connectGeneration) {
        const error = new Error('this connection has been superseded by a newer one')
        error.code = 'NBD_CONNECT_SUPERSEDED'
        throw error
      }
    } catch (error) {
      // don't leak the transport (a socket, a child process, ...): disconnect()
      // is a no-op as long as we're not connected, so nobody else will close it
      this.#destroyTransport(transport)
      throw error
    }
    this.#transport = transport
    this.#receiver = receiver
    this.#connected = true
    this.#startReceiving(transport, receiver)
  }

  async connect() {
    const promise = this.#connect()
    try {
      return await pTimeout.call(promise, this.#connectTimeout)
    } catch (error) {
      // pTimeout does not cancel: #connect() may still be running and end up
      // with an opened transport nobody owns anymore
      promise.then(
        () =>
          this.disconnect().catch(cleanupError => warn('error while cleaning up a late connection', { cleanupError })),
        () => {} // the failure is already reported through `error`
      )
      throw error
    }
  }

  async disconnect() {
    if (!this.#connected) {
      return
    }
    this.#connected = false
    const transport = this.#transport
    this.#transport = undefined
    if (transport === undefined) {
      return
    }

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a disconnect
    buffer.writeInt16BE(NBD_CMD_DISC, 6) // we want to disconnect from nbd server
    buffer.writeBigUInt64BE(queryId, 8)
    buffer.writeBigUInt64BE(0n, 16)
    buffer.writeInt32BE(0, 24)

    try {
      await pTimeout.call(this._closeTransport(transport, buffer), this.#messageTimeout)
    } catch (error) {
      // expected when the other end is already gone, nothing actionable: the
      // transport is destroyed instead of being closed gracefully
      debug('error while closing the nbd transport, destroying it', { error })
      this.#destroyTransport(transport)
    }
  }

  #destroyTransport(transport) {
    try {
      this._destroyTransport(transport)
    } catch (error) {
      warn('error while destroying the nbd transport', { error })
    }
  }

  #clearReconnectPromise = () => {
    this.#reconnectingPromise = undefined
  }

  async #reconnect() {
    await this.disconnect().catch(() => {})
    await pDelay(this.#waitBeforeReconnect) // need to let the xapi clean things on its side
    await this.connect()
  }

  async reconnect() {
    // we need to ensure reconnections do not occur in parallel
    if (this.#reconnectingPromise === undefined) {
      this.#reconnectingPromise = pRetry(() => this.#reconnect(), {
        tries: this.#reconnectRetry,
      })
      this.#reconnectingPromise.then(this.#clearReconnectPromise, this.#clearReconnectPromise)
    }

    return this.#reconnectingPromise
  }

  /* ---------------------------------------------------------------------------
   * handshake
   * ------------------------------------------------------------------------- */

  /**
   * Send an option to the server and check it acknowledged it.
   *
   * We can use individual read/write from the transport here since there is no
   * concurrency during the handshake.
   *
   * The transport is passed explicitly since the client is not connected yet:
   * it is only published once the handshake succeeded.
   *
   * protected: subclasses need it to negotiate their own options (NBD_OPT_STARTTLS)
   *
   * @param {NbdTransport} transport
   * @param {number} option
   * @param {Buffer} [buffer] - the payload of the option
   */
  async _sendOption(transport, option, buffer = Buffer.alloc(0)) {
    await this.#write(transport, OPTS_MAGIC)
    await this.#writeInt32(transport, option)
    await this.#writeInt32(transport, buffer.length)
    await this.#write(transport, buffer)
    assert.strictEqual(await this.#readInt64(transport), NBD_OPT_REPLY_MAGIC) // magic number everywhere
    assert.strictEqual(await this.#readInt32(transport), option) // the option passed
    assert.strictEqual(await this.#readInt32(transport), NBD_REPLY_ACK) // ACK
    const length = await this.#readInt32(transport)
    assert.strictEqual(length, 0) // length
  }

  // we can use individual read/write from the transport here since there is only one handshake at once, no concurrency
  //
  // it works on the transport it is given and returns the one to use for the
  // transmission phase, which is not necessarily the same (TLS upgrade)
  //
  /**
   * @param {NbdTransport} transport
   * @param {ReplyReceiver} receiver
   * @returns {Promise<NbdTransport>}
   */
  async #handshake(transport, receiver) {
    assert((await this.#read(transport, 8)).equals(INIT_PASSWD))
    assert((await this.#read(transport, 8)).equals(OPTS_MAGIC))
    const flagsBuffer = await this.#read(transport, 2)
    const flags = flagsBuffer.readInt16BE(0)
    assert.strictEqual(flags & NBD_FLAG_FIXED_NEWSTYLE, NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options
    await this.#writeInt32(transport, NBD_FLAG_FIXED_NEWSTYLE) // client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    // let the subclass upgrade the transport if it needs to (TLS)
    const secured = await this._secureTransport(transport)
    if (secured !== transport) {
      this.#watchTransport(secured, receiver)
      transport = secured
    }

    // send export name we want to access.
    // it's implicitly closing the negotiation phase.
    await this.#write(transport, OPTS_MAGIC)
    await this.#writeInt32(transport, NBD_OPT_EXPORT_NAME)
    const exportNameBuffer = Buffer.from(this.#exportName)
    await this.#writeInt32(transport, exportNameBuffer.length)
    await this.#write(transport, exportNameBuffer)

    // 8 (export size ) + 2 (flags) + 124 zero = 134
    // must read all to ensure nothing stays in the  buffer
    const answer = await this.#read(transport, 134)
    this.#exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8)
    assert.strictEqual(transmissionFlags & NBD_FLAG_HAS_FLAGS, NBD_FLAG_HAS_FLAGS, 'NBD_FLAG_HAS_FLAGS') // must always be 1 by the norm
    // note : xapi server always send NBD_FLAG_READ_ONLY (3) as a flag
    this.#transmissionFlags = transmissionFlags

    return transport
  }

  /* ---------------------------------------------------------------------------
   * raw read/write
   * ------------------------------------------------------------------------- */

  #getTransport() {
    const transport = this.#transport
    if (transport === undefined) {
      const error = new Error('the nbd client is not connected')
      error.code = 'NBD_NOT_CONNECTED'
      throw error
    }
    return transport
  }

  #read(transport, length) {
    const promise = readChunkStrict(transport.readable, length)
    return pTimeout.call(promise, this.#messageTimeout)
  }

  #write(transport, buffer) {
    let timeout
    const messageTimeout = this.#messageTimeout
    const { writable } = transport
    return Promise.race([
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('timeout'))
        }, messageTimeout)
      }),
      new Promise(resolve =>
        writable.write(buffer, () => {
          clearTimeout(timeout)
          resolve()
        })
      ),
    ])
  }

  async #readInt32(transport) {
    const buffer = await this.#read(transport, 4)
    return buffer.readInt32BE(0)
  }

  async #readInt64(transport) {
    const buffer = await this.#read(transport, 8)
    return buffer.readBigUInt64BE(0)
  }

  #writeInt32(transport, int) {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int)
    return this.#write(transport, buffer)
  }

  /* ---------------------------------------------------------------------------
   * transmission
   * ------------------------------------------------------------------------- */

  async #readBlock(index, size, target) {
    // we don't want to add anything in backlog while reconnecting
    if (this.#reconnectingPromise) {
      await this.#reconnectingPromise
    }

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    // create and send  command at once to ensure there is no concurrency issue
    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a simple block read
    buffer.writeInt16BE(NBD_CMD_READ, 6) // we want to read a data block
    buffer.writeBigUInt64BE(queryId, 8)
    // byte offset in the raw disk
    const offset = BigInt(index) * BigInt(size)
    const remaining = this.#exportSize - offset
    if (remaining < BigInt(size)) {
      size = Number(remaining)
    }

    buffer.writeBigUInt64BE(offset, 16)
    buffer.writeInt32BE(size, 24)

    return new Promise((resolve, reject) => {
      function decoratedReject(error) {
        error.index = index
        error.size = size
        reject(error)
      }

      const transport = this.#getTransport()
      const receiver = this.#receiver
      // the answer can come in any order, the receiver matches it with this query
      receiver.add(queryId, {
        size,
        // the payload is copied directly into it, the last block of the export may be shorter
        target: target?.subarray(0, size),
        resolve,
        reject: decoratedReject,
      })
      // really send the command to the server
      this.#write(transport, buffer).catch(error => {
        receiver.delete(queryId)
        decoratedReject(error)
      })
    })
  }

  /**
   * @param {number} index
   * @param {number} [size]
   * @param {Buffer} [target] - optional, where to write the data instead of a newly allocated Buffer,
   *   must be at least `size` long. The returned Buffer is then a view on it
   * @returns {Promise<Buffer>}
   */
  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE, target) {
    if (target !== undefined) {
      assert.ok(target.length >= size, `target is too small: ${target.length} < ${size}`)
    }
    return this.#retry(() => this.#readBlock(index, size, target), `reading block ${index}`)
  }

  /**
   * Sends a command whose answer has no payload
   *
   * @param {number} type - NBD_CMD_*
   * @param {bigint} offset
   * @param {number} length
   * @param {Buffer} [data] - sent after the request (NBD_CMD_WRITE)
   * @returns {Promise<void>}
   */
  async #command(type, offset, length, data) {
    // we don't want to add anything in backlog while reconnecting
    if (this.#reconnectingPromise) {
      await this.#reconnectingPromise
    }

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    const header = Buffer.alloc(28)
    header.writeInt32BE(NBD_REQUEST_MAGIC, 0)
    header.writeInt16BE(0, 4) // no command flags
    header.writeInt16BE(type, 6)
    header.writeBigUInt64BE(queryId, 8)
    header.writeBigUInt64BE(offset, 16)
    header.writeInt32BE(length, 24)

    return new Promise((resolve, reject) => {
      function decoratedReject(error) {
        error.offset = offset
        error.size = length
        reject(error)
      }

      const transport = this.#getTransport()
      const receiver = this.#receiver
      receiver.add(queryId, { noPayload: true, resolve, reject: decoratedReject })
      // the request and its data are queued at once: no other query can come in between
      const sent =
        data === undefined
          ? this.#write(transport, header)
          : Promise.all([this.#write(transport, header), this.#write(transport, data)])
      sent.catch(error => {
        receiver.delete(queryId)
        decoratedReject(error)
      })
    })
  }

  #retry(fn, description) {
    return pRetry(fn, {
      tries: this.#readBlockRetries,
      // the server refused the request (nbdError): it would refuse it again
      when: error => error.code !== 'ERR_ABORTED' && error.nbdError === undefined,
      onRetry: async err => {
        warn(`will retry ${description}`, err)
        await this.reconnect()
      },
    })
  }

  // the bytes of the block `index`, the last block of the export may be shorter
  #blockRange(index, size) {
    const offset = BigInt(index) * BigInt(size)
    assert.ok(offset < this.#exportSize, `block ${index} is beyond the end of the export`)
    const remaining = this.#exportSize - offset
    return { offset, length: remaining < BigInt(size) ? Number(remaining) : size }
  }

  #assertCapability(isCapable, description) {
    if (!isCapable) {
      const error = new Error(`the NBD export does not allow to ${description}`)
      error.code = this.readOnly ? 'EROFS' : 'ENOTSUP'
      throw error
    }
  }

  /**
   * A write is idempotent: it is retried after a reconnection like a read
   *
   * @param {number} index
   * @param {Buffer} data - the data of the block, shorter for the last block of the export. It must not be
   *   modified until the returned promise is settled
   * @param {number} [size] - the size of the blocks: the data are written at `index * size`
   * @returns {Promise<void>}
   */
  async writeBlock(index, data, size = NBD_DEFAULT_BLOCK_SIZE) {
    this.#assertCapability(!this.readOnly, `write block ${index}`)
    const { offset, length } = this.#blockRange(index, size)
    assert.strictEqual(data.length, length, `block ${index} must be ${length} bytes, got ${data.length}`)
    return this.#retry(() => this.#command(NBD_CMD_WRITE, offset, length, data), `writing block ${index}`)
  }

  /**
   * Writes zeroes on the block `index` without sending them
   *
   * @param {number} index
   * @param {number} [size]
   * @returns {Promise<void>}
   */
  async writeZeroes(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    this.#assertCapability(!this.readOnly && this.canWriteZeroes, `write zeroes on block ${index}`)
    const { offset, length } = this.#blockRange(index, size)
    return this.#retry(() => this.#command(NBD_CMD_WRITE_ZEROES, offset, length), `writing zeroes on block ${index}`)
  }

  /**
   * Tells the server the data of the block `index` are not needed anymore, reading it afterwards gives
   * undefined data
   *
   * @param {number} index
   * @param {number} [size]
   * @returns {Promise<void>}
   */
  async trim(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    this.#assertCapability(!this.readOnly && this.canTrim, `trim block ${index}`)
    const { offset, length } = this.#blockRange(index, size)
    return this.#retry(() => this.#command(NBD_CMD_TRIM, offset, length), `trimming block ${index}`)
  }

  /**
   * Resolves once all the writes acknowledged before have reached a permanent storage
   *
   * @returns {Promise<void>}
   */
  async flush() {
    this.#assertCapability(this.canFlush, 'flush')
    return this.#retry(() => this.#command(NBD_CMD_FLUSH, 0n, 0), 'flushing')
  }
}
