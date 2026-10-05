import assert from 'node:assert'
import { pFromCallback } from 'promise-toolbox'
import { readChunk, readChunkStrict } from '@vates/read-chunk'
import {
  INIT_PASSWD,
  NBD_CMD_DISC,
  NBD_CMD_READ,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_FLAG_READ_ONLY,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_REPLY_ACK,
  NBD_REPLY_MAGIC,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
} from '../constants.mjs'

const NBD_EINVAL = 22

/**
 * Minimal read-only newstyle NBD server, used by the tests only.
 *
 * It is transport agnostic on purpose: the unit tests drive it through two
 * in-memory `PassThrough`, the integration tests through the standard streams
 * of a real process.
 *
 * @param {object} options
 * @param {import('node:stream').Readable} options.readable - where the client queries are read from
 * @param {import('node:stream').Writable} options.writable - where the answers are written to
 * @param {Buffer} options.data - the content of the export
 * @param {string} [options.exportName] - the export name the client must ask for
 * @param {boolean} [options.answerInReverse] - answer by pairs, in reverse order, to check the client handles out of order answers
 * @param {(request: {offset: bigint, length: number, index: number}) => number} [options.errorCode] - non zero to answer an error to this read
 * @returns {Promise<void>} resolves when the client disconnected or closed the connection
 */
export async function serveNbd({ readable, writable, data, exportName = '', answerInReverse = false, errorCode }) {
  const write = buffer => pFromCallback(cb => writable.write(buffer, cb))

  // handshake: server flags
  await write(INIT_PASSWD)
  await write(OPTS_MAGIC)
  const serverFlags = Buffer.alloc(2)
  serverFlags.writeInt16BE(NBD_FLAG_FIXED_NEWSTYLE)
  await write(serverFlags)

  // client flags
  await readChunkStrict(readable, 4)

  // options, until the client selects an export
  let selected = false
  do {
    assert.ok((await readChunkStrict(readable, 8)).equals(OPTS_MAGIC), 'option magic')
    const option = (await readChunkStrict(readable, 4)).readInt32BE(0)
    const length = (await readChunkStrict(readable, 4)).readInt32BE(0)
    const payload = length > 0 ? await readChunkStrict(readable, length) : Buffer.alloc(0)

    if (option === NBD_OPT_EXPORT_NAME) {
      assert.strictEqual(payload.toString(), exportName, 'export name')
      // 8 (size) + 2 (transmission flags) + 124 zeroes
      const answer = Buffer.alloc(134)
      answer.writeBigUInt64BE(BigInt(data.length), 0)
      answer.writeInt16BE(NBD_FLAG_HAS_FLAGS | NBD_FLAG_READ_ONLY, 8)
      await write(answer)
      selected = true
    } else {
      // ack everything else
      const answer = Buffer.alloc(20)
      answer.writeBigUInt64BE(NBD_OPT_REPLY_MAGIC, 0)
      answer.writeInt32BE(option, 8)
      answer.writeInt32BE(NBD_REPLY_ACK, 12)
      answer.writeInt32BE(0, 16)
      await write(answer)
    }
  } while (!selected)

  // transmission
  let index = 0
  let pending = []

  const answer = async ({ handle, offset, length, index }, forcedCode) => {
    const code = forcedCode ?? errorCode?.({ handle, offset, length, index }) ?? 0
    const header = Buffer.alloc(16)
    header.writeInt32BE(NBD_REPLY_MAGIC, 0)
    header.writeInt32BE(code, 4)
    header.writeBigUInt64BE(handle, 8)
    await write(header)
    if (code === 0) {
      await write(data.subarray(Number(offset), Number(offset) + length))
    }
  }

  const flush = async () => {
    const requests = pending
    pending = []
    for (const request of requests.reverse()) {
      await answer(request)
    }
  }

  while (true) {
    const request = await readChunk(readable, 28)
    if (request === null || request.length < 28) {
      // the client closed the connection without a NBD_CMD_DISC
      break
    }
    assert.strictEqual(request.readInt32BE(0), NBD_REQUEST_MAGIC, 'request magic')
    const type = request.readInt16BE(6)
    const handle = request.readBigUInt64BE(8)

    if (type === NBD_CMD_DISC) {
      await flush()
      break
    }

    if (type !== NBD_CMD_READ) {
      await answer({ handle, offset: 0n, length: 0, index: index++ }, NBD_EINVAL)
      continue
    }

    const read = {
      handle,
      offset: request.readBigUInt64BE(16),
      length: request.readInt32BE(24),
      index: index++,
    }
    pending.push(read)
    if (!answerInReverse || pending.length === 2) {
      await flush()
    }
  }
}
