# Drive Vectura from a program

`vectura serve` is built to be spawned: the program that starts it talks
NBD to it over the child's standard input and output and reads any range
of the disk in any order. This guide states the contract and shows it from
Python with libnbd, from C, and from Node.js.

## The contract

- **One process, one disk, one connection.** Spawn one `serve` per disk
  you read. The export does not advertise multiple connections.
- **The password is in the environment, only.** Put `VECTURA_PASSWORD` in
  the child's environment. Never on the command line: it would be visible
  in the process table.
- **Standard input** carries your NBD client flags, options and requests.
  **Standard output** carries the server's greeting, option replies and
  simple replies, and nothing else, ever.
- **Standard error** carries diagnostics with a `vectura:` prefix and, with
  `--verbose`, the transcript. Read it or discard it; if you pipe it,
  drain the pipe so the child never blocks on it. No line on it ever
  contains the password, the ticket or the session cookie.
- **Negotiate fixed newstyle.** Send `NBD_FLAG_C_FIXED_NEWSTYLE`, then
  `NBD_OPT_GO` for the export size, the read-only flag and the block
  sizes. Any export name is accepted, the empty one included.
- **Read within the limits.** `NBD_CMD_READ` at any offset and length
  inside the export, at most 32 MiB per command, 1 MiB preferred. A
  command past the export or larger than 32 MiB is answered `NBD_EINVAL`.
- **Match replies by cookie.** Commands are answered as soon as their data
  is complete, which can be out of order.
- **End with `NBD_CMD_DISC`.** The child closes the disk, logs out and
  exits 0. Closing its standard input instead makes it do the same cleanup
  and exit 1 with `the nbd client left without disconnecting` on standard
  error.
- **Exit codes.** 0 on a clean end, 1 when the host or the client failed,
  2 for a usage error such as a missing password or a bad flag; usage
  errors are reported before any connection is made.

## Python, with libnbd

```python
import os
import nbd

env = dict(os.environ, VECTURA_PASSWORD=password)  # never a command-line argument
h = nbd.NBD()
h.connect_command([
    "vectura", "serve",
    "--host", "esxi.example",
    "--user", "root",
    "--vm-id", "3",
    "--disk", "[datastore1] vm/vm.vmdk",
    "--thumbprint", "sha256:BA:78:16:...:AD",
])
size = h.get_size()
first = h.pread(1 << 20, 0)
last = h.pread(1 << 20, size - (1 << 20))
h.shutdown()  # sends NBD_CMD_DISC; the child exits 0
```

`connect_command` spawns the child, pipes its standard input and output
and negotiates with `NBD_OPT_GO`. Set `VECTURA_PASSWORD` in the parent's
environment before the call; libnbd passes the environment through. For
concurrent reads, libnbd's asynchronous `aio_pread` keeps several commands
in flight; see the next section for how many.

## C, with libnbd

```c
struct nbd_handle *h = nbd_create();
char *argv[] = {
    "vectura", "serve",
    "--host", "esxi.example", "--user", "root", "--vm-id", "3",
    "--disk", "[datastore1] vm/vm.vmdk",
    "--thumbprint", "sha256:BA:78:16:...:AD",
    NULL,
};
if (nbd_connect_command(h, argv) == -1) { /* nbd_get_error() */ }
int64_t size = nbd_get_size(h);
nbd_pread(h, buf, sizeof buf, 0, 0);
nbd_shutdown(h, 0);
nbd_close(h);
```

## Node.js

Node has no NBD client in its standard library, but any client that works
on a duplex stream can be given the child's pipes:

```js
const { spawn } = require('node:child_process')
const { Duplex } = require('node:stream')

const child = spawn(
  'vectura',
  [
    'serve',
    '--host',
    'esxi.example',
    '--user',
    'root',
    '--vm-id',
    '3',
    '--disk',
    '[datastore1] vm/vm.vmdk',
    '--thumbprint',
    'sha256:BA:78:16:...:AD',
  ],
  {
    env: { ...process.env, VECTURA_PASSWORD: password },
    stdio: ['pipe', 'pipe', 'inherit'],
  }
)

// One stream that reads the server's replies and writes your requests.
const nbd = Duplex.from({ readable: child.stdout, writable: child.stdin })

child.on('exit', code => {
  // 0 after your NBD_CMD_DISC; 1 if the host failed or you closed stdin first.
})
```

A client that only accepts a TCP socket needs a small bridge: a local
`net.createServer` whose accepted socket is piped both ways into the
child's pipes, one child per accepted connection.

## Keep the host busy

`serve` fetches the disk from the host in reads of at most 1 MiB and keeps
up to `--depth` of them in flight, 16 by default. A 16 MiB command alone
fills a depth of 16; sixteen 1 MiB commands do the same. Keep at least
that much outstanding from your side, or the window sits idle between
your commands. The depth is a per-host budget: when several of your
processes read from the same host at once, lower `--depth` so that the
total stays at or under 32.

## Lifetimes

- An idle export costs nothing for at least 30 minutes: a client that
  pauses between reads does not need to reconnect within that time.
- The management session expires after 30 to 52 minutes without a
  management call. A longer run still serves every byte and exits 0; its
  final `Logout` is refused and reported on standard error.
- Killing the child with a signal skips the logout. The host expires the
  abandoned session by itself after about half an hour, but prefer
  `NBD_CMD_DISC`.
- Connections to the host time out after 10 seconds; a read the host does
  not answer for 60 seconds ends the run with `NBD_EIO` to every command
  in flight and exit code 1.

## Related

- [The NBD export](../reference/nbd-export.md) lists every option and
  command and how it is answered.
- [Command line](../reference/command-line.md) lists the flags and exit
  codes.
