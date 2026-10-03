import assert from 'node:assert'
import { pFromCallback } from 'promise-toolbox'
import { readChunk, readChunkStrict } from '@vates/read-chunk'
import {
  INIT_PASSWD,
  NBD_CMD_DISC,
  NBD_CMD_FLUSH,
  NBD_CMD_READ,
  NBD_CMD_TRIM,
  NBD_CMD_WRITE,
  NBD_CMD_WRITE_ZEROES,
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
} from '../constants.mjs'

const NBD_EPERM = 1
const NBD_EINVAL = 22

/**
 * Minimal newstyle NBD server, used by the tests only.
 *
 * It is transport agnostic on purpose: the unit tests drive it through two
 * in-memory `PassThrough`, the integration tests through the standard streams
 * of a real process.
 *
 * @param {object} options
 * @param {import('node:stream').Readable} options.readable - where the client queries are read from
 * @param {import('node:stream').Writable} options.writable - where the answers are written to
 * @param {Buffer} options.data - the content of the export, modified by the writes of a writable export
 * @param {boolean} [options.allowWrites] - accept writes, flushes, trims and write zeroes, the export is read-only otherwise
 * @param {string} [options.exportName] - the export name the client must ask for
 * @param {boolean} [options.answerInReverse] - answer by pairs, in reverse order, to check the client handles out of order answers
 * @param {(request: {type: number, offset: bigint, length: number, index: number}) => number} [options.errorCode] - non zero to answer an error to this request
 * @param {number} [options.chunkSize] - split the answers in chunks of this size, to check the client reassembles them
 * @param {number} [options.stopAnsweringAfter] - stop answering (without closing) after this number of answers
 * @returns {Promise<void>} resolves when the client disconnected or closed the connection
 */
export async function serveNbd({
  readable,
  writable,
  data,
  exportName = '',
  allowWrites = false,
  answerInReverse = false,
  errorCode,
  chunkSize,
  stopAnsweringAfter = Infinity,
}) {
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
      answer.writeInt16BE(
        NBD_FLAG_HAS_FLAGS |
          (allowWrites ? NBD_FLAG_SEND_FLUSH | NBD_FLAG_SEND_TRIM | NBD_FLAG_SEND_WRITE_ZEROES : NBD_FLAG_READ_ONLY),
        8
      )
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

  let nbAnswers = 0
  const answer = async ({ type = NBD_CMD_READ, handle, offset, length, index }, forcedCode) => {
    if (nbAnswers++ >= stopAnsweringAfter) {
      return
    }
    const code = forcedCode ?? errorCode?.({ type, handle, offset, length, index }) ?? 0
    const header = Buffer.alloc(16)
    header.writeInt32BE(NBD_REPLY_MAGIC, 0)
    header.writeInt32BE(code, 4)
    header.writeBigUInt64BE(handle, 8)
    let message = header
    if (code === 0 && type === NBD_CMD_READ) {
      message = Buffer.concat([header, data.subarray(Number(offset), Number(offset) + length)])
    }
    if (chunkSize === undefined) {
      await write(message)
    } else {
      for (let i = 0; i < message.length; i += chunkSize) {
        await write(message.subarray(i, i + chunkSize))
      }
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

    if (type === NBD_CMD_WRITE || type === NBD_CMD_FLUSH || type === NBD_CMD_TRIM || type === NBD_CMD_WRITE_ZEROES) {
      const command = {
        type,
        handle,
        offset: request.readBigUInt64BE(16),
        length: request.readInt32BE(24),
        index: index++,
      }
      // the data of a write must be read, even when it is refused
      const payload = type === NBD_CMD_WRITE ? await readChunkStrict(readable, command.length) : undefined
      if (!allowWrites) {
        await answer(command, NBD_EPERM)
        continue
      }
      if (errorCode?.(command) ?? 0) {
        await answer(command)
        continue
      }
      const start = Number(command.offset)
      if (type === NBD_CMD_WRITE) {
        payload.copy(data, start)
      } else if (type !== NBD_CMD_FLUSH) {
        data.fill(0, start, start + command.length)
      }
      await answer(command, 0)
      continue
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
