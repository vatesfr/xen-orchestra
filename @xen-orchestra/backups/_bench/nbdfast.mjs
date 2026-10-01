// Minimal plain NBD read client using net.Socket `onread`: the kernel writes into a reused
// buffer, no per-chunk allocation. Measures how fast the client side can go.
// env: NBD_HOST NBD_PORT QD (in-flight requests) SIZE_GB CYCLE_MB ALLOC=new|pool
import net from 'node:net'
import { performance } from 'node:perf_hooks'

const env = process.env
const BLOCK = 2 * 1024 * 1024
const QD = Number(env.QD ?? 16)
const TOTAL = Number(env.SIZE_GB ?? 8) * 1024
const CYCLE = Number(env.CYCLE_MB ?? 512) / 2
const ALLOC = env.ALLOC ?? 'new'
const pool = Array.from({ length: QD * 2 }, () => Buffer.allocUnsafeSlow(BLOCK))
let poolIdx = 0
const getBuffer = () => (ALLOC === 'pool' ? pool[poolIdx++ % pool.length] : Buffer.allocUnsafe(BLOCK))

const readBuf = Buffer.allocUnsafeSlow(4 * 1024 * 1024)
let state = 'handshake'
let hs = Buffer.alloc(0)
let hdr = Buffer.alloc(16)
let hdrLen = 0
let cur // { dest, filled }
let done = 0
let sent = 0
const nbBlocks = TOTAL / 2
let resolveEnd
const end = new Promise(r => (resolveEnd = r))
const t0 = performance.now()
const cpu0 = process.cpuUsage()

const sock = net.connect({
  host: env.NBD_HOST,
  port: Number(env.NBD_PORT),
  onread: {
    buffer: readBuf,
    callback(n, buf) {
      let off = 0
      if (state === 'handshake') {
        hs = Buffer.concat([hs, buf.subarray(0, n)])
        if (hs.length >= 18 && hs.length < 18 + 134) {
          if (!this.sentOpt) {
            this.sentOpt = true
            const b = Buffer.alloc(4 + 16)
            b.writeUInt32BE(1, 0) // client flags: FIXED_NEWSTYLE
            b.write('IHAVEOPT', 4)
            b.writeUInt32BE(1, 12) // NBD_OPT_EXPORT_NAME
            b.writeUInt32BE(0, 16)
            sock.write(b)
          }
        }
        if (hs.length >= 18 + 134) {
          state = 'data'
          for (let i = 0; i < QD; i++) sendReq()
        }
        return
      }
      while (off < n) {
        if (cur === undefined) {
          const k = Math.min(16 - hdrLen, n - off)
          buf.copy(hdr, hdrLen, off, off + k)
          hdrLen += k
          off += k
          if (hdrLen === 16) {
            hdrLen = 0
            cur = { dest: getBuffer(), filled: 0 }
          }
          continue
        }
        const k = Math.min(BLOCK - cur.filled, n - off)
        buf.copy(cur.dest, cur.filled, off, off + k)
        cur.filled += k
        off += k
        if (cur.filled === BLOCK) {
          cur = undefined
          done++
          if (sent < nbBlocks) sendReq()
          else if (done === nbBlocks) resolveEnd()
        }
      }
    },
  },
})
const req = Buffer.alloc(28)
function sendReq() {
  const i = sent++ % CYCLE
  const b = Buffer.allocUnsafe(28)
  b.writeUInt32BE(0x25609513, 0)
  b.writeUInt16BE(0, 4)
  b.writeUInt16BE(0, 6)
  b.writeBigUInt64BE(BigInt(sent), 8)
  b.writeBigUInt64BE(BigInt(i) * BigInt(BLOCK), 16)
  b.writeUInt32BE(BLOCK, 24)
  sock.write(b)
}
await end
const s = (performance.now() - t0) / 1e3
const cpu = process.cpuUsage(cpu0)
console.log(JSON.stringify({ client: 'onread', ALLOC, QD, MBps: Math.round(TOTAL / s), cpuPct: Math.round(((cpu.user + cpu.system) / 1e6 / s) * 100) }))
process.exit(0)
