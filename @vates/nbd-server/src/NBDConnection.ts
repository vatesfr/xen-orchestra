import * as net from 'node:net';
import * as tls from 'node:tls';
import { readChunkStrict } from './utils/read-chunk.js';
import { DiskManager } from './DiskManager.js';
import { WriteMutex } from './WriteMutex.js';
import * as C from './constants.js';
import { RandomAccessDisk } from '@xen-orchestra/disk-transform';

export class NBDConnection {
  private socket: net.Socket | tls.TLSSocket;
  private disk: RandomAccessDisk | null = null;
  private exportName: string = '';
  private transmissionPhase = false;
  private tlsOptions: tls.TlsOptions | null = null;
  private diskManager: DiskManager;
  private diskAcquired = false;
  private maxTransferSize: number;
  private writeMutex = new WriteMutex();
  private reading = 0
  private writing = 0
  private buffer  = Buffer.alloc(0)
  private nextRead = (valuel:unknown)=>{}

  constructor(
    socket: net.Socket | tls.TLSSocket, 
    tlsOptions: tls.TlsOptions | undefined, 
    diskManager: DiskManager,
    maxTransferSize: number
  ) {
    this.socket = socket;
    this.tlsOptions = tlsOptions || null;
    this.diskManager = diskManager;
    this.maxTransferSize = maxTransferSize;
    /*this.socket.on('data', buffer => {
      this.buffer = Buffer.concat([this.buffer, buffer])
      this.nextRead( this.buffer)
    })*/
  }

  async handleConnection() {
    try {
      await this.handshake();
      if (this.transmissionPhase) {
        await this.transmissionLoop();
      }
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      if (this.disk && this.diskAcquired) {
        this.diskManager.release(this.disk);
        this.diskAcquired = false;
      }
      this.socket.destroy();
    }
  }

  private async handshake() {
    // Send initial handshake
    const handshake = Buffer.alloc(18);
    handshake.writeBigUInt64BE(C.NBD_MAGIC, 0);
    handshake.writeBigUInt64BE(C.NBD_OPTS_MAGIC, 8);
    
    // Set server flags - include FIXED_NEWSTYLE for STARTTLS support
    let serverFlags = C.NBD_FLAG_FIXED_NEWSTYLE | C.NBD_FLAG_NO_ZEROES;
    handshake.writeUInt16BE(serverFlags, 16);
    await this.write(handshake);

    // Read client flags
    const clientFlags = await this.read(4);
    const flags = clientFlags.readUInt32BE(0);
    const fixedNewstyle = !!(flags & C.NBD_FLAG_C_FIXED_NEWSTYLE);
    const noZeroes = !!(flags & C.NBD_FLAG_C_NO_ZEROES);

    if (!fixedNewstyle) {
      throw new Error('Client must support fixed newstyle negotiation');
    }

    // Option haggling phase
    await this.optionHaggling(noZeroes);
  }

  private async optionHaggling(noZeroes: boolean) {
    while (true) {
      const optHeader = await this.read(16);
      const magic = optHeader.readBigUInt64BE(0);
      const option = optHeader.readUInt32BE(8);
      const length = optHeader.readUInt32BE(12);

      if (magic !== C.NBD_OPTS_MAGIC) {
        throw new Error('Invalid option magic');
      }

      const optData = length > 0 ? await this.read(length) : Buffer.alloc(0);

      if (option === C.NBD_OPT_STARTTLS) {
        await this.handleStartTLS();
        continue;
      } else if (option === C.NBD_OPT_EXPORT_NAME) {
        await this.handleExportName(optData, noZeroes);
        return;
      } else if (option === C.NBD_OPT_GO) {
        const finished = await this.handleGo(optData, noZeroes);
        if (finished) return;
      } else if (option === C.NBD_OPT_ABORT) {
        throw new Error('Client aborted');
      } else if (option === C.NBD_OPT_LIST) {
        await this.handleList();
      } else {
        await this.sendOptReply(option, C.NBD_REP_ERR_UNSUP, Buffer.alloc(0));
      }
    }
  }

  private async handleStartTLS() {
    if (!this.tlsOptions) {
      // TLS not configured, send error
      const reply = Buffer.alloc(20);
      reply.writeBigUInt64BE(BigInt(C.NBD_REP_MAGIC), 0);
      reply.writeUInt32BE(C.NBD_OPT_STARTTLS, 8);
      reply.writeUInt32BE(C.NBD_REP_ERR_UNSUP, 12);
      reply.writeUInt32BE(0, 16);
      await this.write(reply);
      return;
    }

    if (this.socket instanceof tls.TLSSocket) {
      // Already using TLS, send error
      const reply = Buffer.alloc(20);
      reply.writeBigUInt64BE(BigInt(C.NBD_REP_MAGIC), 0);
      reply.writeUInt32BE(C.NBD_OPT_STARTTLS, 8);
      reply.writeUInt32BE(C.NBD_REP_ERR_UNSUP, 12);
      reply.writeUInt32BE(0, 16);
      await this.write(reply);
      return;
    }

    // Send ACK to indicate we're ready for TLS
    const ack = Buffer.alloc(20);
    ack.writeBigUInt64BE(BigInt(C.NBD_REP_MAGIC), 0);
    ack.writeUInt32BE(C.NBD_OPT_STARTTLS, 8);
    ack.writeUInt32BE(C.NBD_REP_ACK, 12);
    ack.writeUInt32BE(0, 16);
    await this.write(ack);

    // Upgrade the connection to TLS
    const plainSocket = this.socket as net.Socket;
    const tlsSocket = new tls.TLSSocket(plainSocket, {
      isServer: true,
      ...this.tlsOptions
    });

    await new Promise<void>((resolve, reject) => {
      tlsSocket.once('secure', () => resolve());
      tlsSocket.once('error', reject);
    });

    this.socket = tlsSocket;
    console.log('TLS handshake completed');
  }

  private async handleExportName(data: Buffer, noZeroes: boolean) {
    this.exportName = data.toString('utf8');
    this.disk = (this.socket as any).server.exports.get(this.exportName) || null;

    if (!this.disk) {
      throw new Error(`Export ${this.exportName} not found`);
    }

    await this.diskManager.acquire(this.disk);
    this.diskAcquired = true;

    const reply = Buffer.alloc(noZeroes ? 10 : 134);
    reply.writeBigUInt64BE(BigInt(this.disk.getVirtualSize()), 0);
    const flags = C.NBD_FLAG_HAS_FLAGS | C.NBD_FLAG_SEND_FLUSH | C.NBD_FLAG_CAN_MULTI_CONN;
    reply.writeUInt16BE(flags, 8);
    
    await this.write(reply);
    this.transmissionPhase = true;
  }

  private async handleGo(data: Buffer, noZeroes: boolean): Promise<boolean> {
    let offset = 0;
    const nameLen = data.readUInt32BE(offset);
    offset += 4;
    this.exportName = data.slice(offset, offset + nameLen).toString('utf8');
    offset += nameLen;

    this.disk = (this.socket as any).server.exports.get(this.exportName) || null;

    if (!this.disk) {
      await this.sendOptReply(C.NBD_OPT_GO, C.NBD_REP_ERR_UNSUP, Buffer.alloc(0));
      return false;
    }

    await this.diskManager.acquire(this.disk);
    this.diskAcquired = true;

    // Send INFO_EXPORT
    const exportInfo = Buffer.alloc(12);
    exportInfo.writeUInt16BE(C.NBD_INFO_EXPORT, 0);
    exportInfo.writeBigUInt64BE(BigInt(this.disk.getVirtualSize()), 2);
    const flags = C.NBD_FLAG_HAS_FLAGS | C.NBD_FLAG_SEND_FLUSH | C.NBD_FLAG_CAN_MULTI_CONN;
    exportInfo.writeUInt16BE(flags, 10);
    await this.sendOptReply(C.NBD_OPT_GO, C.NBD_REP_INFO, exportInfo);

    // Send INFO_BLOCK_SIZE
    const blockInfo = Buffer.alloc(14);
    blockInfo.writeUInt16BE(C.NBD_INFO_BLOCK_SIZE, 0);
    const blockSize = this.disk.getBlockSize();
    blockInfo.writeUInt32BE(blockSize, 2); // minimum: 1 block
    blockInfo.writeUInt32BE(blockSize, 6); // preferred: 1 block
    blockInfo.writeUInt32BE(this.maxTransferSize, 10); // maximum: configured size
    await this.sendOptReply(C.NBD_OPT_GO, C.NBD_REP_INFO, blockInfo);

    // Send ACK
    await this.sendOptReply(C.NBD_OPT_GO, C.NBD_REP_ACK, Buffer.alloc(0));
    this.transmissionPhase = true;
    return true;
  }

  private async handleList() {
    const exports = (this.socket as any).server.exports;
    for (const [name] of exports) {
      const nameBuffer = Buffer.from(name, 'utf8');
      const reply = Buffer.alloc(24 + nameBuffer.length);
      reply.writeBigUInt64BE(BigInt(C.NBD_REP_MAGIC), 0);
      reply.writeUInt32BE(C.NBD_OPT_LIST, 8);
      reply.writeUInt32BE(C.NBD_REP_SERVER, 12);
      reply.writeUInt32BE(4 + nameBuffer.length, 16);
      reply.writeUInt32BE(nameBuffer.length, 20);
      nameBuffer.copy(reply, 24);
      await this.write(reply);
    }
    
    const ack = Buffer.alloc(20);
    ack.writeBigUInt64BE(BigInt(C.NBD_REP_MAGIC), 0);
    ack.writeUInt32BE(C.NBD_OPT_LIST, 8);
    ack.writeUInt32BE(C.NBD_REP_ACK, 12);
    ack.writeUInt32BE(0, 16);
    await this.write(ack);
  }

  private async sendOptReply(option: number, replyType: number, data: Buffer) {
    const header = Buffer.alloc(20 + data.length);
    header.writeBigUInt64BE(BigInt(C.NBD_REP_MAGIC), 0);
    header.writeUInt32BE(option, 8);
    header.writeUInt32BE(replyType, 12);
    header.writeUInt32BE(data.length, 16);
    if (data.length > 0) {
      data.copy(header, 20);
    }
    await this.write(header);
  }

  private async transmissionLoop() {
    while (true) {
      const reqHeader = await this.read(28);
      const magic = reqHeader.readUInt32BE(0);
      const flags = reqHeader.readUInt16BE(4);
      const type = reqHeader.readUInt16BE(6);
      const handle = reqHeader.slice(8, 16);
      const offset = reqHeader.readBigUInt64BE(16);
      const length = reqHeader.readUInt32BE(24);

      if (magic !== C.NBD_REQUEST_MAGIC) {
        throw new Error('Invalid request magic');
      }

      if (type === C.NBD_CMD_DISC) { 
        break;
      }

      await this.handleCommand(type, handle, Number(offset), length);
    }
  }

  private async handleCommand(cmd: number, handle: Buffer, offset: number, length: number) {
    if (cmd === C.NBD_CMD_READ) {
      await this.handleRead(handle, offset, length);
    } else if (cmd === C.NBD_CMD_FLUSH) {
      await this.handleFlush(handle);
    } else {
      await this.sendError(handle, 22); // EINVAL
    }
  }

  private async handleRead(handle: Buffer, offset: number, length: number) {
    if (!this.disk) {
      await this.sendError(handle, 5); // EIO
      return;
    }

    const blockSize = this.disk.getBlockSize();
    
    // Check alignment
    if (offset % blockSize !== 0) {
      await this.sendError(handle, 22); // EINVAL - unaligned offset
      return;
    }
    
    if (length % blockSize !== 0) {
      await this.sendError(handle, 22); // EINVAL - unaligned length
      return;
    }

    if (length > this.maxTransferSize) {
      await this.sendError(handle, 22); // EINVAL - exceeds max transfer size
      return;
    }

    // Acquire write lock to ensure atomic write
    const startBlock = offset / blockSize;
    const numBlocks = length / blockSize;
    // We know we need at least one block, let's wait for it before taking the mutex 
    let firstBlock = await this.disk.readBlock(startBlock )
    await this.writeMutex.acquire();
    try {
      // Send reply header
      const reply = Buffer.alloc(16);
      reply.writeUInt32BE(C.NBD_REPLY_MAGIC, 0);
      reply.writeUInt32BE(0, 4); // success
      handle.copy(reply, 8);
      await this.write(reply);
      await this.write(firstBlock.data);


      // Stream next blocks directly to socket
      for (let i = 1; i < numBlocks; i++) {
        const {data} = await this.disk.readBlock(startBlock +1) ;
        await this.write(data);
      }
    } finally {
      this.writeMutex.release();
    }
  }

  private async handleFlush(handle: Buffer) {
    await this.writeMutex.acquire();
    try {
      const reply = Buffer.alloc(16);
      reply.writeUInt32BE(C.NBD_REPLY_MAGIC, 0);
      reply.writeUInt32BE(0, 4); // success
      handle.copy(reply, 8);
      await this.write(reply);
    } finally {
      this.writeMutex.release();
    }
  }

  private async sendError(handle: Buffer, errorCode: number) {
    await this.writeMutex.acquire();
    try {
      const reply = Buffer.alloc(16);
      reply.writeUInt32BE(C.NBD_REPLY_MAGIC, 0);
      reply.writeUInt32BE(errorCode, 4);
      handle.copy(reply, 8);
      await this.write(reply);
    } finally {
      this.writeMutex.release();
    }
  }

  private async read(length: number): Promise<Buffer> {
    const start = performance.now()
    const buffer = await readChunkStrict(this.socket, length)
     this.reading += performance.now() - start
     return buffer
  }

  private write(data: Buffer): Promise<void> {
    const start = performance.now()
    return new Promise((resolve, reject) => {
      this.socket.write(data, (err) => {
      this.writing += performance.now() - start
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
