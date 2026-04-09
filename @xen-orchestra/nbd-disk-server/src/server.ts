import * as tls from "tls";
import * as net from "net"; 
import {
  NBD_MAGIC,
  NBD_IHAVEOPT,
  NBD_REP_MAGIC,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_NO_ZEROES,
  NBD_FLAG_C_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_FLAG_READ_ONLY,
  NBD_FLAG_SEND_DF,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_ABORT,
  NBD_OPT_LIST,
  NBD_OPT_STARTTLS,
  NBD_OPT_INFO,
  NBD_OPT_GO,
  NBD_OPT_STRUCTURED_REPLY,
  NBD_OPT_LIST_META_CONTEXT,
  NBD_OPT_SET_META_CONTEXT,
  NBD_REP_ACK,
  NBD_REP_SERVER,
  NBD_REP_INFO,
  NBD_REP_META_CONTEXT,
  NBD_REP_ERR_UNSUP,
  NBD_REP_ERR_POLICY,
  NBD_REP_ERR_INVALID,
  NBD_REP_ERR_TLS_REQD,
  NBD_REP_ERR_UNKNOWN,
  NBD_INFO_EXPORT,
  NBD_INFO_NAME,
  NBD_INFO_BLOCK_SIZE,
  NBD_CMD_READ,
  NBD_CMD_DISC,
  NBD_CMD_BLOCK_STATUS,
  NBD_REQUEST_MAGIC,
  NBD_STRUCTURED_REPLY_MAGIC,
  NBD_REPLY_FLAG_DONE,
  NBD_REPLY_TYPE_NONE,
  NBD_REPLY_TYPE_OFFSET_DATA,
  NBD_REPLY_TYPE_OFFSET_HOLE,
  NBD_REPLY_TYPE_BLOCK_STATUS,
  NBD_REPLY_TYPE_ERROR,
  NBD_EIO,
  NBD_EINVAL,
  NBD_ENOTSUP,
  NBD_META_CONTEXT_BASE_ALLOCATION,
  NBD_STATE_HOLE,
  NBD_STATE_ZERO,
} from "./constants.js";
import { DiskBlock, RandomAccessDisk } from "@xen-orchestra/disk-transform";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NbdServerOptions {
  /** IPv4, IPv6 or FQDN to listen on */
  address: string;
  /** TCP port (default 10809) */
  port?: number;
  /** PEM-encoded server certificate */
  cert: string | Buffer;
  /** PEM-encoded server private key */
  key: string | Buffer;
  /**
   * PEM-encoded CA certificate(s) used to verify the client certificate.
   * Client certificates not signed by this CA will be rejected.
   */
  ca: string | Buffer;
}

// ─── Connection state ─────────────────────────────────────────────────────────

type Phase = "handshake" | "options" | "transmission" | "closed";

interface ConnectionState {
  socket: net.Socket | tls.TLSSocket;
  tlsUpgraded: boolean;
  structuredRepliesEnabled: boolean;
  metaContextEnabled: boolean; // base:allocation accepted
  metaContextId: number;       // assigned ID for base:allocation
  phase: Phase;
  buf: Buffer;
  exportName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writeBigUInt64BE(buf: Buffer, value: bigint, offset: number): void {
  buf.writeBigUInt64BE(value, offset);
}

function buildOptionReply(
  optCode: number,
  replyType: number,
  data: Buffer = Buffer.alloc(0)
): Buffer {
  // magic(8) + opt(4) + reply_type(4) + length(4) = 20 bytes header
  const header = Buffer.allocUnsafe(20);
  writeBigUInt64BE(header, NBD_REP_MAGIC, 0);
  header.writeUInt32BE(optCode, 8);
  header.writeUInt32BE(replyType, 12);
  header.writeUInt32BE(data.length, 16);
  return Buffer.concat([header, data]);
}

function buildStructuredReply(
  flags: number,
  type: number,
  handle: bigint,
  data: Buffer = Buffer.alloc(0)
): Buffer {
  // magic(4) + flags(2) + type(2) + handle(8) + length(4) = 20 bytes
  const header = Buffer.allocUnsafe(20);
  header.writeUInt32BE(NBD_STRUCTURED_REPLY_MAGIC, 0);
  header.writeUInt16BE(flags, 4);
  header.writeUInt16BE(type, 6);
  writeBigUInt64BE(header, handle, 8);
  header.writeUInt32BE(data.length, 16);
  return Buffer.concat([header, data]);
}

function buildStructuredError(
  handle: bigint,
  errorCode: number,
  message: string,
  done: boolean
): Buffer {
  const msgBuf = Buffer.from(message, "utf8");
  const data = Buffer.allocUnsafe(6 + msgBuf.length);
  data.writeUInt32BE(errorCode, 0);
  data.writeUInt16BE(msgBuf.length, 4);
  msgBuf.copy(data, 6);
  const flags = done ? NBD_REPLY_FLAG_DONE : 0;
  return buildStructuredReply(flags, NBD_REPLY_TYPE_ERROR, handle, data);
}

// ─── Server ───────────────────────────────────────────────────────────────────

export class NbdServer {
  private readonly address: string;
  private readonly port: number;
  private readonly tlsOptions: tls.TlsOptions; 
  private server: net.Server | null = null;
  private readonly disks = new Map<string, RandomAccessDisk>()

  constructor(options: NbdServerOptions) {
    this.address = options.address;
    this.port = options.port ?? 10809; 
    this.tlsOptions = {
      cert: options.cert,
      key: options.key,
      ca: options.ca,
      requestCert: true,
      rejectUnauthorized: true,
    };
  }

  // ─── Disks handler ──────────────────────────────────────────────────

  addExport(disk:RandomAccessDisk){
    this.disks.set(disk.uuid, disk)
  }
  removeExports(disk:RandomAccessDisk){
    this.disks.delete(disk.uuid)
  }

  /** Start listening. Returns a promise that resolves when the server is bound. */
  listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      // We create a plain TCP server; TLS is negotiated per-connection via STARTTLS
      this.server = net.createServer((socket) => {
        this.handleConnection(socket).catch((err) => {
          console.error("[NBD] Unhandled connection error:", err);
          socket.destroy();
        });
      });

      this.server.on("error", reject);
      this.server.listen(this.port, this.address, () => {
        console.log(`[NBD] Listening on ${this.address}:${this.port}`);
        resolve();
      });
    });
  }

  /** Stop the server gracefully. */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) return resolve();
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  // ─── Connection handler ──────────────────────────────────────────────────

  private async handleConnection(rawSocket: net.Socket): Promise<void> {
    const state: ConnectionState = {
      socket: rawSocket,
      tlsUpgraded: false,
      structuredRepliesEnabled: false,
      metaContextEnabled: false,
      metaContextId: 1,
      phase: "handshake",
      buf: Buffer.alloc(0),
      exportName: null,
    };

    const send = (data: Buffer) =>
      new Promise<void>((res, rej) =>
        state.socket.write(data, (err) => (err ? rej(err) : res()))
      );

    // ── Newstyle handshake ──────────────────────────────────────────────────
    //  S: NBDMAGIC + IHAVEOPT + handshake_flags(2)
    const handshake = Buffer.allocUnsafe(18);
    writeBigUInt64BE(handshake, NBD_MAGIC, 0);
    writeBigUInt64BE(handshake, NBD_IHAVEOPT, 8);
    handshake.writeUInt16BE(NBD_FLAG_FIXED_NEWSTYLE | NBD_FLAG_NO_ZEROES, 16);
    await send(handshake);
    state.phase = "options";

    // ── Read loop ───────────────────────────────────────────────────────────
    await new Promise<void>((resolve, reject) => {
      const onData = async (chunk: Buffer) => {
        state.buf = Buffer.concat([state.buf, chunk]);
        try {
          await this.processBuffer(state, send);
          if (state.phase === "closed") {
            state.socket.destroy();
            resolve();
          }
        } catch (err) {
          reject(err);
        }
      };

      state.socket.on("data", onData);
      state.socket.on("end", resolve);
      state.socket.on("error", reject);
    });
  }

  // ─── Buffer processor ────────────────────────────────────────────────────

  private async processBuffer(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>
  ): Promise<void> {
    while (true) {
      if (state.phase === "options") {
        const done = await this.processOption(state, send);
        if (!done) break;
      } else if (state.phase === "transmission") {
        const done = await this.processCommand(state, send);
        if (!done) break;
      } else {
        break;
      }
    }
  }

  // ─── Option phase ────────────────────────────────────────────────────────

  private async processOption(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>
  ): Promise<boolean> {
    // First message from client: client_flags (4 bytes)
    if (!state.tlsUpgraded && state.buf.length < 4) return false;
    if (!state.tlsUpgraded && !(state as any)._clientFlagsRead) {
      const clientFlags = state.buf.readUInt32BE(0);
      state.buf = state.buf.subarray(4);
      (state as any)._clientFlagsRead = true;

      if (!(clientFlags & NBD_FLAG_C_FIXED_NEWSTYLE)) {
        // Reject: we only support fixed newstyle
        state.socket.destroy();
        state.phase = "closed";
        return false;
      }
    }

    // Wait for option header: magic(8) + opt(4) + length(4)
    if (state.buf.length < 16) return false;

    const magic = state.buf.readBigUInt64BE(0);
    if (magic !== NBD_IHAVEOPT) {
      console.error("[NBD] Bad option magic, dropping connection");
      state.socket.destroy();
      state.phase = "closed";
      return false;
    }

    const optCode = state.buf.readUInt32BE(8);
    const dataLen = state.buf.readUInt32BE(12);

    if (state.buf.length < 16 + dataLen) return false;

    const optData = state.buf.subarray(16, 16 + dataLen);
    state.buf = state.buf.subarray(16 + dataLen);

    await this.handleOption(state, send, optCode, optData);
    return state.phase === "options"; // keep consuming if still in options
  }

  private async handleOption(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    optCode: number,
    optData: Buffer
  ): Promise<void> {
    // Before TLS is established, only NBD_OPT_STARTTLS and NBD_OPT_ABORT are allowed
    if (!state.tlsUpgraded && optCode !== NBD_OPT_STARTTLS && optCode !== NBD_OPT_ABORT) {
      // Require TLS for everything else
      await send(buildOptionReply(optCode, NBD_REP_ERR_TLS_REQD));
      return;
    }

    switch (optCode) {
      case NBD_OPT_ABORT:
        await send(buildOptionReply(NBD_OPT_ABORT, NBD_REP_ACK));
        state.phase = "closed";
        break;

      case NBD_OPT_STARTTLS:
        await this.handleStartTls(state, send);
        break;

      case NBD_OPT_STRUCTURED_REPLY:
        state.structuredRepliesEnabled = true;
        await send(buildOptionReply(NBD_OPT_STRUCTURED_REPLY, NBD_REP_ACK));
        break;

      case NBD_OPT_LIST:
        await this.handleOptList(state, send);
        break;

      case NBD_OPT_INFO:
      case NBD_OPT_GO:
        await this.handleOptInfoGo(state, send, optCode, optData);
        break;

      case NBD_OPT_LIST_META_CONTEXT:
        await this.handleListMetaContext(state, send, optCode, optData);
        break;

      case NBD_OPT_SET_META_CONTEXT:
        await this.handleSetMetaContext(state, send, optCode, optData);
        break;

      case NBD_OPT_EXPORT_NAME:
        // We refuse simple mode (NBD_OPT_EXPORT_NAME enters transmission without structured replies check)
        await send(buildOptionReply(NBD_OPT_EXPORT_NAME, NBD_REP_ERR_POLICY,
          Buffer.from("NBD_OPT_EXPORT_NAME (simple mode) is not supported; use NBD_OPT_GO")));
        state.phase = "closed";
        break;

      default:
        console.log({optCode})
        await send(buildOptionReply(optCode, NBD_REP_ERR_UNSUP));
    }
  }

  // ─── STARTTLS ────────────────────────────────────────────────────────────

  private async handleStartTls(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>
  ): Promise<void> {
    if (state.tlsUpgraded) {
      await send(buildOptionReply(NBD_OPT_STARTTLS, NBD_REP_ERR_INVALID,
        Buffer.from("TLS already active")));
      return;
    }

    // ACK first, then upgrade
    await send(buildOptionReply(NBD_OPT_STARTTLS, NBD_REP_ACK));

    // Upgrade the raw socket to TLS
    const rawSocket = state.socket as net.Socket;
    const pendingData = state.buf; // buffered bytes before TLS
    state.buf = Buffer.alloc(0);

    await new Promise<void>((resolve, reject) => {
      const tlsSocket = new tls.TLSSocket(rawSocket, {
        isServer: true,
        ...this.tlsOptions,
      });

      tlsSocket.on("secure", () => {
        // Verify client certificate
        const cert = tlsSocket.getPeerCertificate();
        if (!tlsSocket.authorized || !cert || Object.keys(cert).length === 0) {
          console.error("[NBD] Client certificate verification failed:", tlsSocket.authorizationError);
          tlsSocket.destroy(new Error("Client certificate required and must be valid"));
          reject(new Error("TLS client auth failed"));
          return;
        }

        state.socket = tlsSocket;
        state.tlsUpgraded = true;
        // Reset client flags so the new socket's data handler re-reads them
        // (in practice the client won't resend them after STARTTLS)
        (state as any)._clientFlagsRead = true;

        // Re-emit any buffered data
        if (pendingData.length > 0) {
          state.buf = Buffer.concat([pendingData, state.buf]);
        }

        resolve();
      });

      tlsSocket.on("error", reject);
    });
  }

  // ─── List exports ────────────────────────────────────────────────────────

  private async handleOptList(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>
  ): Promise<void> {
    // NBD_REP_SERVER payload: name_length(4) + name
    for(const uuid of this.disks.keys()){
        const name = Buffer.from(uuid, "utf8");
        const payload = Buffer.allocUnsafe(4 + name.length);
        payload.writeUInt32BE(name.length, 0);
        name.copy(payload, 4);
        await send(buildOptionReply(NBD_OPT_LIST, NBD_REP_SERVER, payload));
    }
    await send(buildOptionReply(NBD_OPT_LIST, NBD_REP_ACK));
  }

  // ─── INFO / GO ───────────────────────────────────────────────────────────

  private async handleOptInfoGo(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    optCode: number,
    optData: Buffer
  ): Promise<void> {
    if (!state.structuredRepliesEnabled) {
      await send(buildOptionReply(optCode, NBD_REP_ERR_INVALID,
        Buffer.from("Structured replies must be negotiated before GO/INFO")));
      return;
    }

    if (optData.length < 6) {
      await send(buildOptionReply(optCode, NBD_REP_ERR_INVALID));
      return;
    }

    const nameLen = optData.readUInt32BE(0);
    if (optData.length < 4 + nameLen + 2) {
      await send(buildOptionReply(optCode, NBD_REP_ERR_INVALID));
      return;
    }

    const exportName = optData.subarray(4, 4 + nameLen).toString("utf8");

    // Accept only existing exports, no default setting
    const disk = this.disks.get(exportName);
    if (disk === undefined) {
      await send(buildOptionReply(optCode, NBD_REP_ERR_UNKNOWN,
        Buffer.from(`Unknown export: ${exportName}`)));
      return;
    }

    state.exportName = exportName;

    const blockSize = disk.getBlockSize();
    const virtualSize = disk.getVirtualSize();

    // Send NBD_INFO_EXPORT
    const exportInfo = Buffer.allocUnsafe(2 + 8 + 2);
    exportInfo.writeUInt16BE(NBD_INFO_EXPORT, 0);
    exportInfo.writeBigUInt64BE(BigInt(virtualSize), 2);
    const txFlags =
      NBD_FLAG_HAS_FLAGS |
      NBD_FLAG_READ_ONLY |
      NBD_FLAG_SEND_DF;
    exportInfo.writeUInt16BE(txFlags, 10);
    await send(buildOptionReply(optCode, NBD_REP_INFO, exportInfo));

    // Send NBD_INFO_NAME
    const nameBuf = Buffer.from(exportName, "utf8");
    const nameInfo = Buffer.allocUnsafe(2 + nameBuf.length);
    nameInfo.writeUInt16BE(NBD_INFO_NAME, 0);
    nameBuf.copy(nameInfo, 2);
    await send(buildOptionReply(optCode, NBD_REP_INFO, nameInfo));

    // Send NBD_INFO_BLOCK_SIZE
    const blockInfo = Buffer.allocUnsafe(2 + 4 + 4 + 4);
    blockInfo.writeUInt16BE(NBD_INFO_BLOCK_SIZE, 0);
    blockInfo.writeUInt32BE(blockSize, 2);   // minimum block size
    blockInfo.writeUInt32BE(blockSize, 6);   // preferred block size
    blockInfo.writeUInt32BE(blockSize, 10);  // maximum payload (1 block)
    await send(buildOptionReply(optCode, NBD_REP_INFO, blockInfo));

    // ACK
    await send(buildOptionReply(optCode, NBD_REP_ACK));

    if (optCode === NBD_OPT_GO) {
      state.phase = "transmission";
    }
  }

  // ─── Meta context negotiation ────────────────────────────────────────────

  private parseMetaContextRequest(optData: Buffer): { exportName: string; queries: string[] } | null {
    if (optData.length < 4) return null;
    const nameLen = optData.readUInt32BE(0);
    if (optData.length < 4 + nameLen + 4) return null;
    const exportName = optData.subarray(4, 4 + nameLen).toString("utf8");
    const numQueries = optData.readUInt32BE(4 + nameLen);
    let offset = 4 + nameLen + 4;
    const queries: string[] = [];
    for (let i = 0; i < numQueries; i++) {
      if (optData.length < offset + 4) return null;
      const qLen = optData.readUInt32BE(offset);
      offset += 4;
      if (optData.length < offset + qLen) return null;
      queries.push(optData.subarray(offset, offset + qLen).toString("utf8"));
      offset += qLen;
    }
    return { exportName, queries };
  }

  private async handleListMetaContext(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    optCode: number,
    optData: Buffer
  ): Promise<void> {
    const req = this.parseMetaContextRequest(optData);
    if (!req) {
      await send(buildOptionReply(optCode, NBD_REP_ERR_INVALID));
      return;
    }

    const wantAll = req.queries.length === 0;
    const wantsBase = wantAll || req.queries.some(
      (q) => q === NBD_META_CONTEXT_BASE_ALLOCATION || q === "base:"
    );

    if (wantsBase) {
      const name = Buffer.from(NBD_META_CONTEXT_BASE_ALLOCATION, "utf8");
      const payload = Buffer.allocUnsafe(4 + name.length);
      payload.writeUInt32BE(state.metaContextId, 0);
      name.copy(payload, 4);
      await send(buildOptionReply(optCode, NBD_REP_META_CONTEXT, payload));
    }

    await send(buildOptionReply(optCode, NBD_REP_ACK));
  }

  private async handleSetMetaContext(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    optCode: number,
    optData: Buffer
  ): Promise<void> {
    const req = this.parseMetaContextRequest(optData);
    if (!req) {
      await send(buildOptionReply(optCode, NBD_REP_ERR_INVALID));
      return;
    }

    state.metaContextEnabled = false;
    const wantsBase = req.queries.some(
      (q) => q === NBD_META_CONTEXT_BASE_ALLOCATION
    );

    if (wantsBase) {
      state.metaContextEnabled = true;
      const name = Buffer.from(NBD_META_CONTEXT_BASE_ALLOCATION, "utf8");
      const payload = Buffer.allocUnsafe(4 + name.length);
      payload.writeUInt32BE(state.metaContextId, 0);
      name.copy(payload, 4);
      await send(buildOptionReply(optCode, NBD_REP_META_CONTEXT, payload));
    }

    await send(buildOptionReply(optCode, NBD_REP_ACK));
  }

  // ─── Transmission phase ──────────────────────────────────────────────────

  private async processCommand(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>
  ): Promise<boolean> {
    // Request header: magic(4) + flags(2) + type(2) + handle(8) + offset(8) + length(4) = 28 bytes
    if (state.buf.length < 28) return false;

    const magic = state.buf.readUInt32BE(0);
    if (magic !== NBD_REQUEST_MAGIC) {
      console.error("[NBD] Bad request magic");
      state.phase = "closed";
      return false;
    }

    // const cmdFlags = state.buf.readUInt16BE(4);
    const cmdType = state.buf.readUInt16BE(6);
    const handle = state.buf.readBigUInt64BE(8);
    const offset = state.buf.readBigUInt64BE(16);
    const length = state.buf.readUInt32BE(24);

    state.buf = state.buf.subarray(28);

    await this.handleCommand(state, send, cmdType, handle, offset, length);
    return state.phase === "transmission";
  }

  private async handleCommand(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    cmdType: number,
    handle: bigint,
    offset: bigint,
    length: number
  ): Promise<void> {
    switch (cmdType) {
      case NBD_CMD_DISC:
        state.phase = "closed";
        break;

      case NBD_CMD_READ:
        await this.handleRead(state, send, handle, offset, length);
        break;

      case NBD_CMD_BLOCK_STATUS:
        await this.handleBlockStatus(state, send, handle, offset, length);
        break;

      default:
        // Unsupported command: send structured error
        await send(
          buildStructuredError(handle, NBD_ENOTSUP, `Command ${cmdType} not supported`, true)
        );
    }
  }

  // ─── Read ────────────────────────────────────────────────────────────────

  private async handleRead(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    handle: bigint,
    offset: bigint,
    length: number
  ): Promise<void> {
    if(state.exportName === null){
          await send(buildStructuredError(handle, NBD_EIO,
            `Export name is not set`, true));
        return;
    }
    const disk = this.disks.get(state.exportName);
    if (disk === undefined) {
        await send(buildStructuredError(handle, NBD_EIO,
            `Export name does nto exists anymore`, true));
      return;
    } 
    const blockSize = disk.getBlockSize();
    const virtualSize = disk.getVirtualSize();
    const off = Number(offset);

    // Validate alignment and bounds
    if (off % blockSize !== 0 || length % blockSize !== 0) {
      await send(buildStructuredError(handle, NBD_EINVAL,
        "Read not aligned to block boundary", true));
      return;
    }
    if (off + length > virtualSize) {
      await send(buildStructuredError(handle, NBD_EINVAL,
        "Read beyond end of disk", true));
      return;
    }

    const startBlock = off / blockSize;
    const numBlocks = length / blockSize;

    // Stream block by block, grouping consecutive allocated/hole regions
    let i = 0;
    while (i < numBlocks) {
      const blockIndex = startBlock + i;
      if (disk.hasBlock(blockIndex)) {
        // Send OFFSET_DATA chunk
        try {
          const { data } = await disk.readBlock(blockIndex);
          const chunkOffset = BigInt(off + i * blockSize);
          const header = Buffer.allocUnsafe(8);
          header.writeBigUInt64BE(chunkOffset, 0);

          const isLast = i === numBlocks - 1;
          const flags = isLast ? NBD_REPLY_FLAG_DONE : 0;
          const replyHeader = buildStructuredReply(
            flags,
            NBD_REPLY_TYPE_OFFSET_DATA,
            handle,
            Buffer.alloc(0)
          );
          // Adjust data length in header
          const fullReply = Buffer.concat([replyHeader, header, data]);
          // Fix payload length: header(8) + data
          fullReply.writeUInt32BE(8 + data.length, 16);
          await send(fullReply);
        } catch (err) {
          await send(buildStructuredError(handle, NBD_EIO,
            `Failed to read block ${blockIndex}: ${err}`, true));
          return;
        }
      } else {
        // Send OFFSET_HOLE chunk
        const chunkOffset = BigInt(off + i * blockSize);
        const holeData = Buffer.allocUnsafe(8 + 4);
        holeData.writeBigUInt64BE(chunkOffset, 0);
        holeData.writeUInt32BE(blockSize, 8);

        const isLast = i === numBlocks - 1;
        const flags = isLast ? NBD_REPLY_FLAG_DONE : 0;
        await send(buildStructuredReply(flags, NBD_REPLY_TYPE_OFFSET_HOLE, handle, holeData));
      }
      i++;
    }

    // If length was 0, still send done
    if (numBlocks === 0) {
      await send(buildStructuredReply(NBD_REPLY_FLAG_DONE, NBD_REPLY_TYPE_NONE, handle));
    }
  }

  // ─── Block status ────────────────────────────────────────────────────────

  private async handleBlockStatus(
    state: ConnectionState,
    send: (d: Buffer) => Promise<void>,
    handle: bigint,
    offset: bigint,
    length: number
  ): Promise<void> {
    if(state.exportName === null){
          await send(buildStructuredError(handle, NBD_EIO,
            `Export name is not set`, true));
        return;
    }
    if (!state.metaContextEnabled) {
      await send(buildStructuredError(handle, NBD_EINVAL,
        "No meta context selected", true));
      return;
    }

    const disk = this.disks.get(state.exportName);
    if (disk === undefined) {
        await send(buildStructuredError(handle, NBD_EIO,
            `Export name does nto exists anymore`, true));
      return;
    } 
    const blockSize = disk.getBlockSize();
    const virtualSize = disk.getVirtualSize();
    const off = Number(offset);

    if (off % blockSize !== 0) {
      await send(buildStructuredError(handle, NBD_EINVAL,
        "Offset not aligned to block boundary", true));
      return;
    }
    if (off + length > virtualSize) {
      await send(buildStructuredError(handle, NBD_EINVAL,
        "Range beyond end of disk", true));
      return;
    }

    const startBlock = Math.floor(off / blockSize);
    const endBlock = Math.ceil((off + length) / blockSize);

    // Build run-length encoded extents
    // extent: length(4) + flags(4)
    const extents: { len: number; flags: number }[] = [];

    let runStart = startBlock;
    let runAllocated = disk.hasBlock(startBlock);

    for (let i = startBlock + 1; i <= endBlock; i++) {
      const allocated = i < endBlock ? disk.hasBlock(i) : !runAllocated; // force flush at end
      if (allocated !== runAllocated || i === endBlock) {
        const runLen = (i - runStart) * blockSize;
        const flags = runAllocated ? 0 : NBD_STATE_HOLE | NBD_STATE_ZERO;
        extents.push({ len: runLen, flags });
        runStart = i;
        runAllocated = allocated;
      }
    }

    // Payload: context_id(4) + extents
    const payloadSize = 4 + extents.length * 8;
    const payload = Buffer.allocUnsafe(payloadSize);
    payload.writeUInt32BE(state.metaContextId, 0);
    for (let i = 0; i < extents.length; i++) {
      payload.writeUInt32BE(extents[i].len, 4 + i * 8);
      payload.writeUInt32BE(extents[i].flags, 8 + i * 8);
    }

    await send(
      buildStructuredReply(NBD_REPLY_FLAG_DONE, NBD_REPLY_TYPE_BLOCK_STATUS, handle, payload)
    );
  }
}


class MockDisk extends RandomAccessDisk{
  nbBlocks = 5
  blockSize = 2*1024*1024

  readBlock(index: number): Promise<DiskBlock> {
    throw new Error("Method not implemented.");
  }
  getVirtualSize(): number {
    return this.nbBlocks * this.blockSize
  }
  getBlockSize(): number {
    return this.blockSize
  }
  async init(): Promise<void> {
    
  }
  async close(): Promise<void> {
    
  }
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): Array<number> {
    return [1, 3, 5]
  }
  hasBlock(index: number): boolean {
    return index%2 === 1
  }
  
}

const server = new NbdServer({address:'localhost', port: 10809, cert: Buffer.alloc(0), key: Buffer.alloc(0), ca: Buffer.alloc(0)})
console.log('WILL WAIT')
await server.listen()