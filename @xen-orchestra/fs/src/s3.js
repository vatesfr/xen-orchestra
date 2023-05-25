import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { getApplyMd5BodyChecksumPlugin } from '@aws-sdk/middleware-apply-body-checksum'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { PassThrough, pipeline } from 'stream'
import { parse } from 'xo-remote-parser'
import copyStreamToBuffer from './_copyStreamToBuffer.js'
import guessAwsRegion from './_guessAwsRegion.js'
import RemoteHandlerAbstract from './abstract'
import { basename, join, split } from './path'
import { asyncEach } from '@vates/async-each'

// endpoints https://docs.aws.amazon.com/general/latest/gr/s3.html

// limits: https://docs.aws.amazon.com/AmazonS3/latest/dev/qfacts.html
const MAX_PART_SIZE = 1024 * 1024 * 1024 * 5 // 5GB
const { warn } = createLogger('xo:fs:s3')

export default class S3Handler extends RemoteHandlerAbstract {
  #bucket
  #dir
  #s3

  constructor(remote, _opts) {
    super(remote)
    const {
      allowUnauthorized,
      host,
      path,
      username,
      password,
      protocol,
      region = guessAwsRegion(host),
    } = parse(remote.url)

    this.#s3 = new S3Client({
      apiVersion: '2006-03-01',
      endpoint: `${protocol}://${host}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: username,
        secretAccessKey: password,
      },
      tls: protocol === 'https',
      region,
      requestHandler: new NodeHttpHandler({
        socketTimeout: 600000,
        httpAgent: new HttpAgent({
          keepAlive: true,
        }),
        httpsAgent: new HttpsAgent({
          rejectUnauthorized: !allowUnauthorized,
          keepAlive: true,
        }),
      }),
    })

    // Workaround for https://github.com/aws/aws-sdk-js-v3/issues/2673
    this.#s3.middlewareStack.use(getApplyMd5BodyChecksumPlugin(this.#s3.config))

    const parts = split(path)
    this.#bucket = parts.shift()
    this.#dir = join(...parts)
  }

  get type() {
    return 's3'
  }

  #makeCopySource(path) {
    return join(this.#bucket, this.#dir, path)
  }

  #makeKey(file) {
    return join(this.#dir, file)
  }

  #makePrefix(dir) {
    const prefix = join(this.#dir, dir, '/')

    // no prefix for root
    if (prefix !== './') {
      return prefix
    }
  }

  #createParams(file) {
    return { Bucket: this.#bucket, Key: this.#makeKey(file) }
  }

  async #multipartCopy(oldPath, newPath) {
    const size = await this._getSize(oldPath)
    const CopySource = this.#makeCopySource(oldPath)
    const multipartParams = await this.#s3.send(new CreateMultipartUploadCommand({ ...this.#createParams(newPath) }))
    try {
      const parts = []
      let start = 0
      while (start < size) {
        const partNumber = parts.length + 1
        const upload = await this.#s3.send(
          new UploadPartCopyCommand({
            ...multipartParams,
            CopySource,
            CopySourceRange: `bytes=${start}-${Math.min(start + MAX_PART_SIZE, size) - 1}`,
            PartNumber: partNumber,
          })
        )
        parts.push({ ETag: upload.CopyPartResult.ETag, PartNumber: partNumber })
        start += MAX_PART_SIZE
      }
      await this.#s3.send(
        new CompleteMultipartUploadCommand({
          ...multipartParams,
          MultipartUpload: { Parts: parts },
        })
      )
    } catch (e) {
      await this.#s3.send(new AbortMultipartUploadCommand(multipartParams))
      throw e
    }
  }

  async _copy(oldPath, newPath) {
    const CopySource = this.#makeCopySource(oldPath)
    try {
      await this.#s3.send(
        new CopyObjectCommand({
          ...this.#createParams(newPath),
          CopySource,
        })
      )
    } catch (e) {
      // object > 5GB must be copied part by part
      if (e.name === 'EntityTooLarge') {
        return this.#multipartCopy(oldPath, newPath)
      }
      // normalize this error code
      if (e.name === 'NoSuchKey') {
        const error = new Error(`ENOENT: no such file or directory '${oldPath}'`)
        error.cause = e
        error.code = 'ENOENT'
        error.path = oldPath
        throw error
      }
      throw e
    }
  }

  async #isNotEmptyDir(path) {
    const result = await this.#s3.send(
      new ListObjectsV2Command({
        Bucket: this.#bucket,
        MaxKeys: 1,
        Prefix: this.#makePrefix(path),
      })
    )
    return result.Contents?.length > 0
  }

  async #isFile(path) {
    try {
      await this.#s3.send(new HeadObjectCommand(this.#createParams(path)))
      return true
    } catch (error) {
      if (error.name === 'NotFound') {
        return false
      }
      throw error
    }
  }

  async _outputStream(path, input, { validator }) {
    // Workaround for "ReferenceError: ReadableStream is not defined"
    // https://github.com/aws/aws-sdk-js-v3/issues/2522
    const Body = new PassThrough()
    pipeline(input, Body, () => {})

    const upload = new Upload({
      client: this.#s3,
      params: {
        ...this.#createParams(path),
        Body,
      },
    })

    await upload.done()

    if (validator !== undefined) {
      try {
        await validator.call(this, path)
      } catch (error) {
        await this.__unlink(path)
        throw error
      }
    }
  }

  // some objectstorage provider like backblaze, can answer a 500/503 routinely
  // in this case we should retry,  and let their load balancing do its magic
  // https://www.backblaze.com/b2/docs/calling.html#error_handling
  @decorateWith(pRetry.wrap, {
    delays: [100, 200, 500, 1000, 2000],
    when: e => e.$metadata?.httpStatusCode === 500,
    onRetry(error) {
      warn('retrying writing file', {
        attemptNumber: this.attemptNumber,
        delay: this.delay,
        error,
        file: this.arguments[0],
      })
    },
  })
  async _writeFile(file, data, options) {
    return this.#s3.send(
      new PutObjectCommand({
        ...this.#createParams(file),
        Body: data,
      })
    )
  }

  async _createReadStream(path, options) {
    try {
      return (await this.#s3.send(new GetObjectCommand(this.#createParams(path)))).Body
    } catch (e) {
      if (e.name === 'NoSuchKey') {
        const error = new Error(`ENOENT: no such file '${path}'`)
        error.code = 'ENOENT'
        error.path = path
        throw error
      }
      throw e
    }
  }

  async _unlink(path) {
    await this.#s3.send(new DeleteObjectCommand(this.#createParams(path)))

    if (await this.#isNotEmptyDir(path)) {
      const error = new Error(`EISDIR: illegal operation on a directory, unlink '${path}'`)
      error.code = 'EISDIR'
      error.path = path
      throw error
    }
  }

  async _list(dir) {
    let NextContinuationToken
    const uniq = new Set()
    const Prefix = this.#makePrefix(dir)

    do {
      const result = await this.#s3.send(
        new ListObjectsV2Command({
          Bucket: this.#bucket,
          Prefix,
          Delimiter: '/',
          // will only return path until delimiters
          ContinuationToken: NextContinuationToken,
        })
      )

      if (result.IsTruncated) {
        warn(`need pagination to browse the directory ${dir} completely`)
        NextContinuationToken = result.NextContinuationToken
      } else {
        NextContinuationToken = undefined
      }

      // subdirectories
      for (const entry of result.CommonPrefixes ?? []) {
        uniq.add(basename(entry.Prefix))
      }

      // files
      for (const entry of result.Contents ?? []) {
        uniq.add(basename(entry.Key))
      }
    } while (NextContinuationToken !== undefined)

    return [...uniq]
  }

  async _mkdir(path) {
    if (await this.#isFile(path)) {
      const error = new Error(`ENOTDIR: file already exists, mkdir '${path}'`)
      error.code = 'ENOTDIR'
      error.path = path
      throw error
    }
    // nothing to do, directories do not exist, they are part of the files' path
  }

  // s3 doesn't have a rename operation, so copy + delete source
  async _rename(oldPath, newPath) {
    await this.__copy(oldPath, newPath)
    await this.#s3.send(new DeleteObjectCommand(this.#createParams(oldPath)))
  }

  async _getSize(file) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const result = await this.#s3.send(new HeadObjectCommand(this.#createParams(file)))
    return +result.ContentLength
  }

  async _read(file, buffer, position = 0) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const params = this.#createParams(file)
    params.Range = `bytes=${position}-${position + buffer.length - 1}`
    try {
      const result = await this.#s3.send(new GetObjectCommand(params))
      const bytesRead = await copyStreamToBuffer(result.Body, buffer)
      return { bytesRead, buffer }
    } catch (e) {
      if (e.name === 'NoSuchKey') {
        if (await this.#isNotEmptyDir(file)) {
          const error = new Error(`${file} is a directory`)
          error.code = 'EISDIR'
          error.path = file
          throw error
        }
      }
      throw e
    }
  }

  async _rmdir(path) {
    if (await this.#isNotEmptyDir(path)) {
      const error = new Error(`ENOTEMPTY: directory not empty, rmdir '${path}`)
      error.code = 'ENOTEMPTY'
      error.path = path
      throw error
    }

    // nothing to do, directories do not exist, they are part of the files' path
  }

  // reimplement _rmtree to handle efficiantly path with more than 1000 entries in trees
  // @todo : use parallel processing for unlink
  async _rmtree(path) {
    let NextContinuationToken
    const Prefix = this.#makePrefix(path)
    do {
      const result = await this.#s3.send(
        new ListObjectsV2Command({
          Bucket: this.#bucket,
          Prefix,
          ContinuationToken: NextContinuationToken,
        })
      )

      NextContinuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
      await asyncEach(
        result.Contents ?? [],
        async ({ Key }) => {
          // _unlink will add the prefix, but Key contains everything
          // also we don't need to check if we delete a directory, since the list only return files
          await this.#s3.send(
            new DeleteObjectCommand({
              Bucket: this.#bucket,
              Key,
            })
          )
        },
        {
          concurrency: 16,
        }
      )
    } while (NextContinuationToken !== undefined)
  }

  async _openFile(path, flags) {
    return path
  }

  async _closeFile(fd) {}

  useVhdDirectory() {
    return true
  }
}
