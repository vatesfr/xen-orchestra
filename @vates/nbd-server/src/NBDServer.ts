import * as net from 'node:net';
import * as tls from 'node:tls';
import * as fs from 'node:fs';
import { NBDServerOptions } from './interfaces.js';
import {RandomAccessDisk} from '@xen-orchestra/disk-transform'
import { DiskManager } from './DiskManager.js';
import { NBDConnection } from './NBDConnection.js';

export class NBDServer {
  private server: net.Server;
  public exports: Map<string, RandomAccessDisk>;
  private tlsOptions: tls.TlsOptions | null = null;
  private diskManager: DiskManager;
  private maxTransferSize: number;

  constructor(options: NBDServerOptions) {
    this.exports = options.exports;
    this.diskManager = new DiskManager(options.diskTimeout);
    this.maxTransferSize = options.maxTransferSize || 1024 * 1024 * 1024; // Default: 1GB

    if (options.tls) {
      this.tlsOptions = {
        key: typeof options.tls.key === 'string' ? fs.readFileSync(options.tls.key) : options.tls.key,
        cert: typeof options.tls.cert === 'string' ? fs.readFileSync(options.tls.cert) : options.tls.cert,
      };
    }

    // Always start with a plain TCP server
    // TLS upgrade happens via NBD_OPT_STARTTLS during negotiation
    this.server = net.createServer({highWaterMark:10*1024*1024}, (socket) => {
      (socket as any).server = this;
      const conn = new NBDConnection(
        socket, 
        this.tlsOptions || undefined, 
        this.diskManager,
        this.maxTransferSize
      );
      conn.handleConnection();
    });

    this.server.listen(options.port, options.host || '0.0.0.0', () => {
      const addr = this.server.address() as net.AddressInfo;
      const tlsStatus = this.tlsOptions ? ' (STARTTLS available)' : '';
      const timeout = options.diskTimeout || 600000;
      console.log(`NBD server listening on ${addr.address}:${addr.port}${tlsStatus}`);
      console.log(`Disk timeout: ${timeout / 1000}s, Max transfer: ${this.maxTransferSize} bytes`);
    });
  }

  close() {
    this.server.close();
  }
}
