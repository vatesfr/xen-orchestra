import assert from "node:assert";
import { Readable } from "node:stream";
import isUtf8 from "isutf8";

export type ReadChunkResult = Buffer | null;

/**
 * Read a chunk of data from a stream.
 *
 * If size is defined:
 *  - returns Buffer or string (depending on stream encoding)
 *  - returns null if the stream ended before producing data
 *
 * @param stream A readable stream to read from.
 * @param size   Number of bytes to read (ignored in objectMode).
 */
export const readChunk = (
  stream: Readable,
  size?: number
): Promise<ReadChunkResult> =>
  stream.errored != null
    ? Promise.reject(stream.errored)
    : stream.closed || stream.readableEnded
    ? Promise.resolve(null)
    : new Promise((resolve, reject) => {
        if (size !== undefined) {
          assert(size > 0);
          assert(size < 1073741824); // < 1 GiB
        }

        const onEnd = () => {
          resolve(null);
          removeListeners();
        };

        const onError = (error: unknown) => {
          reject(error);
          removeListeners();
        };

        const onReadable = () => {
          const data = stream.read(size as number);
          if (data !== null) {
            resolve(data);
            removeListeners();
          }
        };

        const removeListeners = () => {
          stream.removeListener("end", onEnd);
          stream.removeListener("error", onError);
          stream.removeListener("readable", onReadable);
        };

        stream.on("end", onEnd);
        stream.on("error", onError);
        stream.on("readable", onReadable);

        // Try immediately
        onReadable();
      });

/**
 * Same as readChunk, but throws if not enough data is available.
 */
export async function readChunkStrict(
  stream: Readable,
  size: number
): Promise<Buffer > {
  const chunk = await readChunk(stream, size);

  if (chunk === null) {
    if (size === undefined) {
      throw new Error("stream has ended without data");
    } else {
      throw new Error(
        `stream has ended without data, was looking for ${size} bytes`
      );
    }
  }

const length = (chunk as Buffer).length;
if (length !== size) {
    const error: any = new Error(
    `stream has ended with not enough data (actual: ${length}, expected: ${size})`
    );

    // If small enough and UTF-8, expose text
    if (length < 1024 && Buffer.isBuffer(chunk) && isUtf8(chunk)) {
    error.text = chunk.toString("utf8");
    }

    Object.defineProperty(error, "chunk", { value: chunk });
    throw error;
}

  return chunk;
}
