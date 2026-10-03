// does tls.connect honour `onread`? STARTTLS on a NBD server then count onread vs 'data'
import net from 'node:net'
import tls from 'node:tls'
import { once } from 'node:events'
const port = Number(process.env.NBD_PORT ?? 10810)
const raw = net.connect({ host: '127.0.0.1', port })
await once(raw, 'connect')
const read = async n => {
  while (raw.readableLength < n) await once(raw, 'readable')
  return raw.read(n)
}
await read(18)
const opt = Buffer.alloc(20)
opt.writeUInt32BE(1, 0)
opt.write('IHAVEOPT', 4)
opt.writeUInt32BE(5, 12) // STARTTLS
opt.writeUInt32BE(0, 16)
raw.write(opt)
await read(20)
let onreadCalls = 0
let dataEvents = 0
const s = tls.connect({
  socket: raw,
  rejectUnauthorized: false,
  onread: { buffer: Buffer.alloc(65536), callback: () => void onreadCalls++ },
})
s.on('data', () => dataEvents++)
await once(s, 'secureConnect')
const b = Buffer.alloc(16)
b.write('IHAVEOPT', 0)
b.writeUInt32BE(1, 8) // EXPORT_NAME ''
b.writeUInt32BE(0, 12)
s.write(b)
await new Promise(r => setTimeout(r, 500))
console.log({ onreadCalls, dataEvents })
process.exit(0)
