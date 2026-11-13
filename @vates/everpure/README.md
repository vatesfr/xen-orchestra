<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/everpure

[![Package Version](https://badgen.net/npm/v/@vates/everpure)](https://npmjs.org/package/@vates/everpure) ![License](https://badgen.net/npm/license/@vates/everpure) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/everpure)](https://bundlephobia.com/result?p=@vates/everpure) [![Node compatibility](https://badgen.net/npm/node/@vates/everpure)](https://npmjs.org/package/@vates/everpure)

> Client for the Everpure (Pure Storage FlashArray) REST API 2.x: volume snapshots and changed/allocated block listing

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/everpure):

```sh
npm install --save @vates/everpure
```

## Usage

A client for the REST API 2.x of an Everpure (Pure Storage FlashArray) array,
written in TypeScript. It covers what a backup needs from the array's control
plane: volume snapshots (list, create, delete) and the block map of a snapshot,
either every allocated block or the blocks that changed since another snapshot
(`GET /volumes/diff`, REST 2.9+).

It does not read block data: that goes through iSCSI, see `@vates/iscsi`.

### Client

```ts
import { EverpureClient } from '@vates/everpure'

const client = new EverpureClient({
  url: 'https://array.example.org',
  apiToken: '…', // a dedicated array user, storage_admin role
  allowUnauthorized: true, // self-signed certificate
})
await client.connect() // picks the highest REST 2.x version, opens a session

const snapshot = await client.createVolumeSnapshot('vm-disk-1', { suffix: 'xo-2026-11-13' })

// allocated blocks of the snapshot, as { offset, length } byte ranges
for await (const range of client.listChangedBlocks({ name: snapshot.name, blockSize: 2 * 1024 ** 2 })) {
  …
}

// blocks that changed between two snapshots
for await (const range of client.listChangedBlocks({
  name: 'vm-disk-1.xo-2026-11-13',
  baseName: 'vm-disk-1.xo-2026-11-12',
  blockSize: 2 * 1024 ** 2,
})) {
  …
}

for await (const snapshot of client.listVolumeSnapshots('vm-disk-1')) {
  …
}
await client.deleteVolumeSnapshot(snapshot.name) // destroy + eradicate

await client.close()
```

`listChangedBlocks` queries the array by segments (`segmentLength`, whole
snapshot by default) and follows pagination, so it can be consumed as a stream
without holding the whole map in memory. `blockSize` is the comparison
granularity (a multiple of 512): returned ranges are aligned on it.

The session token is renewed once, transparently, when the array answers 401.
Errors answered by the array are thrown as `EverpureError` (`status`, `errors`).

### CLI

```
$ export EVERPURE_URL=https://array.example.org EVERPURE_API_TOKEN=…
$ vates-everpure --insecure snapshot create vm-disk-1 xo-test
vm-disk-1.xo-test
$ vates-everpure --insecure snapshot list vm-disk-1
$ vates-everpure --insecure diff vm-disk-1.xo-test                  # allocated blocks
$ vates-everpure --insecure diff vm-disk-1.xo-test --base vm-disk-1.xo-prev  # changed blocks
$ vates-everpure --insecure snapshot delete vm-disk-1.xo-test
```

`diff` prints one `<offset> <length>` line per range (`--json` for one JSON
object per line) and a summary on stderr. `DEBUG=vates:everpure` traces every
request.

### Tests

- `yarn test`: unit tests against a fake array (no network).
- `yarn test-integration`: against a real array when `EVERPURE_URL`,
  `EVERPURE_API_TOKEN` and `EVERPURE_VOLUME` are set (`EVERPURE_ALLOW_UNAUTHORIZED=1`
  for a self-signed certificate). It creates and deletes two snapshots of
  `EVERPURE_VOLUME`.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
