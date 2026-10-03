// Open N NBD connections in parallel (spread over several VDIs) on a real XAPI host, hold them,
// report how many succeed and the connection latency
// env: HOST, XAPI_PASSWORD, N, VDIS (comma separated uuids), NBD_ADDRESS (filter), SERIAL=1 to connect one by one
import NbdClient from '@vates/nbd-client'
import { performance } from 'node:perf_hooks'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const { HOST, XAPI_PASSWORD, N = '20', VDIS, NBD_ADDRESS, SERIAL } = process.env
let id = 0
async function call(method, ...params) {
  const res = await fetch(`https://${HOST}/jsonrpc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: ++id }),
  })
  const json = await res.json()
  if (json.error) throw new Error(JSON.stringify(json.error))
  return json.result
}
const session = await call('session.login_with_password', 'root', XAPI_PASSWORD, '1.0', 'nbd-limit-test')
const infos = []
for (const uuid of VDIS.split(',')) {
  const ref = await call('VDI.get_by_uuid', session, uuid)
  let nbd = await call('VDI.get_nbd_info', session, ref)
  if (infos.length === 0) console.log('nbd_info addresses', nbd.map(_ => _.address))
  if (NBD_ADDRESS) nbd = nbd.filter(_ => _.address === NBD_ADDRESS)
  infos.push(nbd[0])
}
const clients = []
const results = []
const t0 = performance.now()
async function open(i) {
  const info = infos[i % infos.length]
  const client = new NbdClient(info, { connectTimeout: 120e3, readBlockRetries: 1, reconnectRetry: 1 })
  const start = performance.now()
  try {
    await client.connect()
    await client.readBlock(0, 2 * 1024 * 1024)
    clients.push(client)
    results.push({ i, ok: true, ms: Math.round(performance.now() - start) })
  } catch (error) {
    results.push({ i, ok: false, ms: Math.round(performance.now() - start), error: error.code ?? error.message })
    client.disconnect().catch(() => {})
  }
}
if (SERIAL === '1') {
  for (let i = 0; i < Number(N); i++) await open(i)
} else {
  await Promise.all(Array.from({ length: Number(N) }, (_, i) => open(i)))
}
const ok = results.filter(_ => _.ok)
const ko = results.filter(_ => !_.ok)
console.log(
  JSON.stringify({
    N: Number(N),
    ok: ok.length,
    failed: ko.length,
    totalMs: Math.round(performance.now() - t0),
    connectMs: ok.map(_ => _.ms).sort((a, b) => a - b),
    errors: [...new Set(ko.map(_ => _.error))],
  })
)
const td = performance.now()
await Promise.all(clients.map(c => c.disconnect().catch(() => {})))
console.log('disconnect all ms', Math.round(performance.now() - td))
await call('session.logout', session)
process.exit(0)
