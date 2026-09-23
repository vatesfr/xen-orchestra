# NBD Server

A high-performance Network Block Device (NBD) server implementation in TypeScript.

## Features

- ✅ Full NBD protocol support (fixed newstyle negotiation)
- ✅ STARTTLS support for encrypted connections
- ✅ Multiple concurrent connections with shared disk access
- ✅ Configurable disk timeout (automatic close after inactivity)
- ✅ Block-aligned reads only (strict alignment checking)
- ✅ Streaming writes (zero-copy where possible)
- ✅ Configurable maximum transfer size
- ✅ Write mutex for preventing response interleaving

## Project Structure

```
src/
├── constants.ts       # NBD protocol constants
├── interfaces.ts      # TypeScript interfaces
├── WriteMutex.ts      # Mutex for serializing socket writes
├── DiskManager.ts     # Disk lifecycle management
├── NBDConnection.ts   # Per-connection handler
├── NBDServer.ts       # Main server class
├── MockDisk.ts        # Mock disk for testing
├── index.ts           # Public API exports
├── integration.test.ts # Integration tests
└── bench.ts           # Performance benchmarks
```

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { NBDServer } from './NBDServer.js';
import { Disk } from './interfaces.js';

// Implement your Disk class
class MyDisk implements Disk {
  async open(): Promise<void> { /* ... */ }
  get size(): number { /* ... */ }
  getBlockSize(): number { /* ... */ }
  async readBlock(blockIndex: number): Promise<Buffer> { /* ... */ }
}

// Create server
const disk = new MyDisk('/path/to/disk.img');
const exports = new Map([['my-disk', disk]]);

const server = new NBDServer({
  port: 10809,
  host: 'localhost',
  tls: {
    key: './server-key.pem',
    cert: './server-cert.pem'
  },
  exports,
  diskTimeout: 10 * 60 * 1000, // 10 minutes
  maxTransferSize: 1024 * 1024 * 1024 // 1GB
});
```

## Testing

### Integration Tests

Tests use system NBD tools (nbdinfo, nbdcopy, nbd-client):

```bash
npm test
```

**Requirements:**
- `nbdinfo` - for querying server info
- `nbdcopy` - for copying data (or `nbd-client` + `dd`)
- `sudo` access may be required for nbd-client tests

**Install NBD tools:**
```bash
# Ubuntu/Debian
sudo apt-get install libnbd-bin nbd-client

# Fedora/RHEL
sudo dnf install libnbd nbdkit nbd
```

### Benchmark

```bash
npm run bench
```

Expected output:
```
Operation                      |      Total |   Duration | Throughput |       IOPS
================================================================================
Sequential Read                |  100.00 MB |    1234.56 ms |   81.00 MB/s |      20000 IOPS
Random Read (4K blocks)        |    3.91 MB |     567.89 ms |    6.88 MB/s |       1761 IOPS
Large Read (10MB blocks)       |  100.00 MB |     890.12 ms |  112.34 MB/s |         11 IOPS
Large Read (64MB blocks)       |   64.00 MB |     678.90 ms |   94.26 MB/s |          1 IOPS
```

## TLS/SSL Support

The server supports STARTTLS for upgrading connections:

1. Client connects via plain TCP
2. Client sends `NBD_OPT_STARTTLS` during negotiation
3. Server upgrades connection to TLS
4. All subsequent communication is encrypted

Generate test certificates:
```bash
openssl req -x509 -newkey rsa:4096 -keyout server-key.pem \
  -out server-cert.pem -days 365 -nodes
```

## Design Decisions

### Disk Management
- Single disk instance shared across multiple connections
- Reference counting ensures disk stays open while in use
- Configurable timeout closes idle disks automatically

### Write Serialization
- WriteMutex prevents response interleaving
- Each response (header + data blocks) written atomically
- Ensures data integrity with concurrent requests

### Zero-Copy Design
- Blocks streamed directly from disk to socket
- No Buffer.concat() for large transfers
- Minimized memory allocations

### Alignment Requirements
- Only block-aligned reads accepted
- Unaligned requests return EINVAL
- Simplifies implementation and improves performance

## License

MIT
