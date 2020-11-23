import net from 'net'
import { pFromCallback } from '../utils'
import readChunk from './readChunk'
import tls from 'tls'
import * as assert from 'assert'

const OK_REPLIES = {
  NBD_REP_ACK: 1,
  NBD_REP_SERVER: 2,
  NBD_REP_INFO: 3,
  NBD_REP_META_CONTEXT: 4
}

const ERR_PREFIX = Math.pow(2, 31)

const ERR_REPLIES = {
  NBD_REP_ERR_UNSUP: ERR_PREFIX + 1,
  NBD_REP_ERR_POLICY: ERR_PREFIX + 2,
  NBD_REP_ERR_INVALID: ERR_PREFIX + 3,
  NBD_REP_ERR_PLATFORM: ERR_PREFIX + 4,
  NBD_REP_ERR_TLS_REQD: ERR_PREFIX + 5,
  NBD_REP_ERR_UNKNOWN: ERR_PREFIX + 6,
  NBD_REP_ERR_SHUTDOWN: ERR_PREFIX + 7,
  NBD_REP_ERR_BLOCK_SIZE_REQD: ERR_PREFIX + 8,
  NBD_REP_ERR_TOO_BIG: ERR_PREFIX + 9,
}

const ALL_REPLIES = { ...OK_REPLIES, ...ERR_REPLIES }

const BACK_RESPONSES = []
Object.entries(ALL_REPLIES).forEach(e => {BACK_RESPONSES[e[1]] = e[0]})

const OPTIONS_TYPES = {
  NBD_OPT_EXPORT_NAME: 1,
  NBD_OPT_ABORT: 2,
  NBD_OPT_LIST: 3,
  NBD_OPT_PEEK_EXPORT: 4,
  NBD_OPT_STARTTLS: 5,
  NBD_OPT_INFO: 6,
  NBD_OPT_GO: 7,
  NBD_OPT_STRUCTURED_REPLY: 8,
  NBD_OPT_LIST_META_CONTEXT: 9,
  NBD_OPT_SET_META_CONTEXT: 10,
}

const BACK_OPTIONS = []
Object.entries(OPTIONS_TYPES).forEach(e => {BACK_OPTIONS[e[1]] = e[0]})

async function sendOption(socket, optionCode, optionDataBuffer = Buffer.alloc(0)) {
  console.log('SEND OPTION', optionCode, BACK_OPTIONS[optionCode])
  await pFromCallback(cb => socket.write(Buffer.from('IHAVEOPT', 'ascii'), cb))
  const responseBuffer = Buffer.alloc(4)
  responseBuffer.writeInt32BE(optionCode)
  await pFromCallback(cb => socket.write(responseBuffer, cb))
  responseBuffer.writeInt32BE(optionDataBuffer.length)
  await pFromCallback(cb => socket.write(responseBuffer, cb))
  if (optionDataBuffer.length > 0)
    await pFromCallback(cb => socket.write(optionDataBuffer, cb))
  if (optionCode === OPTIONS_TYPES.NBD_OPT_EXPORT_NAME) {
    const exportLength = await readChunk(socket, 8)
    console.log('exportLength', exportLength.readBigInt64BE(0))
    const flags = await readChunk(socket, 2)
    console.log('transmission flags', flags)
    // read blank
    await readChunk(socket, 124)
  } else {
    const responseMagic = await readChunk(socket, 8)
    // compare as string to get around the bigInt issue
    assert.strictEqual(responseMagic.readBigUInt64BE(0).toString(16), 0x3e889045565a9.toString(16))
    const responseOption = await readChunk(socket, 4)
    assert.strictEqual(responseOption.readUInt32BE(0), optionCode)
    const responseCode = (await readChunk(socket, 4)).readUInt32BE(0)
    console.log('responseCode', responseCode)
    console.log('responseCode', BACK_RESPONSES[responseCode])
    const responseDataLen = (await readChunk(socket, 4)).readUInt32BE(0)

    console.log('datalen', responseDataLen)

    if (responseDataLen > 0) {
      const data = await readChunk(socket, responseDataLen)
      console.log('DATA', data)
    }
  }
}

async function sendGoOrInfoOption(socket, optionCode, exportName) {
  assert.strictEqual(optionCode === OPTIONS_TYPES.NBD_OPT_INFO || optionCode === OPTIONS_TYPES.NBD_OPT_GO, true)
  const nameBuffer = Buffer.from(exportName, 'ascii')
  const nameLenBuffer = Buffer.alloc(4)
  nameLenBuffer.writeUInt32BE(nameBuffer.length)
  const infoRequsetNumberBuffer = Buffer.alloc(2)
  const dataBuffer = Buffer.concat([nameLenBuffer, nameBuffer, infoRequsetNumberBuffer])
  return sendOption(socket, optionCode, dataBuffer)
}

export async function pingNbdServer({ exportname, address, port = 10809, cert, subject }) {
  console.log('pingNbdServer', { exportname, address, port, cert, subject })
  // https://github.com/xenserver/xs-cbt-samples/blob/master/python2_nbd_client.py
  const socket = net.connect(port, address)
  // https://sourceforge.net/p/nbd/code/ci/cdb0bc57f3faefd7a5562d57ad57cd990781c415/
  socket.setNoDelay()
  socket.on('error', e => console.log('Socket ERROR', e))
  socket.on('close', e => console.log('Socket CLOSE', e))
  await pFromCallback(cb => socket.once('connect', cb))
  console.log('Connected')
  const MAGIC = 'NBDMAGIC'
  const magicChunk = await readChunk(socket, MAGIC.length)
  console.log('magic', magicChunk.toString('ascii'))
  const OPTIONS = 'IHAVEOPT'
  let optChunk = await readChunk(socket, OPTIONS.length)
  console.log('OPTIONS', optChunk.toString('ascii'))
  optChunk = await readChunk(socket, 2)
  const flags = optChunk.readUInt16BE(0)
  const hasFixedNewStyle = !!(flags & 1)

  console.log('FLAGS New Style', hasFixedNewStyle)

  const CLIENT_FLAGS = 1
  const responseBuffer = Buffer.alloc(4)
  responseBuffer.writeInt32BE(CLIENT_FLAGS)
  await pFromCallback(cb => socket.write(responseBuffer, cb))

  await sendOption(socket, OPTIONS_TYPES.NBD_OPT_STARTTLS)

  console.log('READY FOR TLS', 'readable', socket.readable, socket.readableLength, socket.read())
  const tlsSocket = tls.connect({ socket, ca: cert, host: subject })
  tlsSocket.on('error', e => console.log('TLS ERROR', e))
  await pFromCallback(cb => tlsSocket.once('secureConnect', cb))
  console.log('*******TLS DONE!', tlsSocket.readableLength, socket.read())

  await sendOption(tlsSocket, OPTIONS_TYPES.NBD_OPT_EXPORT_NAME, Buffer.from(exportname, 'ascii'))
  //await sendGoOrInfoOption(tlsSocket, OPTIONS_TYPES.NBD_OPT_GO, exportname)
  for (let i = 0; i < 124; i++) {
    optChunk = await readChunk(tlsSocket, 1)
    console.log('byte', i, optChunk)
  }
  console.log('HANDSHAKE DONE', optChunk)
}
