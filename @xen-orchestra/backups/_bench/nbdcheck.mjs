// nbdcheck.mjs : reads a whole NBD export by 2 MiB blocks, prints its sha256 and the rate
// env: NBD_HOST NBD_PORT EXPORTNAME TLS=1 CERT=path NBD_CONC
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import MultiNbdClient from '@vates/nbd-client/multi.mjs'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const env = process.env
const info = { address: env.NBD_HOST ?? '127.0.0.1', port: Number(env.NBD_PORT), exportname: env.EXPORTNAME }
if (env.TLS === '1') info.cert = readFileSync(env.CERT ?? '/data/bench/certs/server-cert.pem', 'utf8')
const client = new MultiNbdClient([info], { nbdConcurrency: Number(env.NBD_CONC ?? 1) })
await client.connect()
const BLOCK = 2 * 1024 * 1024
const size = Number(client.exportSize)
const count = Math.ceil(size / BLOCK)
const hash = createHash('sha256')
const t0 = performance.now()
// 16 reads in flight, hashed in order
const pending = []
let next = 0
for (let i = 0; i < count; i++) {
  while (next < count && next < i + 16) pending.push(client.readBlock(next++, BLOCK))
  hash.update(await pending.shift())
}
const s = (performance.now() - t0) / 1e3
await client.disconnect()
console.log(JSON.stringify({ sha: hash.digest('hex').slice(0, 16), MBps: Math.round(size / 1048576 / s) }))
