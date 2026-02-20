import { RandomAccessDisk } from "@xen-orchestra/disk-transform";

export interface Disk {
  open(): Promise<void>;
  readonly size: number;
  getBlockSize(): number;
  readBlock(blockIndex: number): Promise<Buffer>;
}

export interface NBDServerOptions {
  port: number;
  host?: string;
  tls?: {
    key: Buffer | string;  // Private key (Buffer or path to file)
    cert: Buffer | string; // Certificate (Buffer or path to file)
  };
  exports: Map<string, RandomAccessDisk>;
  diskTimeout?: number; // Timeout in milliseconds (default: 10 minutes)
  maxTransferSize?: number; // Maximum transfer size in bytes (default: 1GB)
}
