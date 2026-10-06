import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  GetObjectLockConfigurationCommand,
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
import { randomBytes } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'
import { acquireConditionalLock, probeConditionalWrites } from './_conditionalLock.js'
import { PassThrough, Transform, pipeline } from 'stream'
import { parse } from 'xo-remote-parser'
import copyStreamToBuffer from './_copyStreamToBuffer.js'
import guessAwsRegion from './_guessAwsRegion.js'
import RemoteHandlerAbstract from './abstract'
import { basename, join, split } from './path'
import { asyncEach } from '@vates/async-each'
import { version } from '../package.json'

// endpoints https://docs.aws.amazon.com/general/latest/gr/s3.html

// limits: https://docs.aws.amazon.com/AmazonS3/latest/dev/qfacts.html
const MAX_PART_SIZE = 1024 * 1024 * 1024 * 5 // 5GB
const MAX_PART_NUMBER = 10000
const MIN_PART_SIZE = 5 * 1024 * 1024
const { debug, info, warn } = createLogger('xo:fs:s3')

export default class S3Handler extends RemoteHandlerAbstract {
  #bucket
  #dir
  #s3
  #httpAgent
  #httpsAgent
  #immutable = false
  #maxPartSize
  #maxPartNumber
  #minPartSize
  #conditionalWrites

  getConfig(key) {
    if (key === 'useVhdDirectory') {
      return true // compatibility layer
    }
    return super.getConfig(key)
  }

  constructor(remote, _opts) {
    super(remote, _opts)
    const {
      allowUnauthorized,
      host,
      path,
      username,
      password,
      protocol,
      region = guessAwsRegion(host),
      maxPartSize = MAX_PART_SIZE,
      maxPartNumber = MAX_PART_NUMBER,
      minPartSize = MIN_PART_SIZE,
    } = parse(remote.url)

    this.#maxPartSize = maxPartSize
    this.#maxPartNumber = maxPartNumber
    this.#minPartSize = minPartSize

    this.#s3 = new S3Client({
      customUserAgent: `xen-orchestra-fs-${version}`,
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
        httpAgent: (this.#httpAgent = new HttpAgent({
          keepAlive: true,
        })),
        httpsAgent: (this.#httpsAgent = new HttpsAgent({
          rejectUnauthorized: !allowUnauthorized,
          keepAlive: true,
        })),
      }),
      // from https://github.com/aws/aws-sdk-js-v3/issues/6810
      // some non AWS services like backblaze or cloudflare don't expect the new headers
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })

    const parts = split(path)
    this.#bucket = parts.shift()
    this.#dir = join(...parts)
  }

  get type() {
    return 's3'
  }

  async _forget() {
    this.#s3.destroy()
    this.#httpAgent.destroy()
    this.#httpsAgent.destroy()
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

  // the `ConditionalLockStore` of `_conditionalLock.js` for the object at `path`
  //
  // It sends its requests with `this.#s3` directly, not through the handler's methods: those go through
  // the handler's concurrency limit, and a refresh queued behind long uploads would let the lock go stale.
  #createLockStore(path) {
    const params = this.#createParams(path)
    const s3 = this.#s3

    // the condition failed: 412 Precondition Failed; 409 ConditionalRequestConflict, AWS's answer while
    // another conditional write on the same key is in progress, i.e. someone else is writing the lock;
    // and for `IfMatch` only, 404: the object does not exist (for `create()`, a 404 means a missing
    // bucket, which is an error, not a held lock)
    const put = async (body, conditions, failedStatuses) => {
      try {
        const result = await s3.send(
          new PutObjectCommand({
            ...params,
            ...conditions,
            Body: body,
          })
        )

        if (result.ETag === undefined) {
          const error = new Error('PutObject returned no ETag', { cause: undefined })
          error.code = 'ENOTSUP'
          throw error
        }

        return result.ETag
      } catch (error) {
        const statusCode = error.$metadata?.httpStatusCode

        if (statusCode !== undefined && failedStatuses.includes(statusCode)) {
          return undefined
        }

        // 501: Not Implemented. 400 unless `error.name === 'RequestTimeout'` (S3 answers a stalled upload with a 400
        // too, and that is a network failure)
        // the provider refuses the condition headers instead of honouring them
        if (statusCode === 501 || (statusCode === 400 && error.name !== 'RequestTimeout')) {
          const err = new Error('conditional writes are refused', { cause: error })
          err.code = 'ENOTSUP'
          throw err
        }

        throw error
      }
    }

    return {
      create: body => put(body, { IfNoneMatch: '*' }, [409, 412]),
      replace: (body, etag) => put(body, { IfMatch: etag }, [404, 409, 412]),
      read: async () => {
        const command = new GetObjectCommand(params)

        // the age of the object is measured on the server's clock, `LastModified` against the `Date` of this
        // response: the clocks of XO, its proxies and the provider need not agree
        let date
        command.middlewareStack.add(
          next => async args => {
            const result = await next(args)
            date = result.response.headers.date
            return result
          },
          { step: 'build' }
        )

        try {
          const result = await s3.send(command)
          const now = date !== undefined ? Date.parse(date) : Date.now()
          return {
            etag: result.ETag,
            body: await result.Body.transformToString(),
            age: now - result.LastModified.getTime(),
          }
        } catch (error) {
          if (error.name === 'NoSuchKey') {
            return undefined
          }
          throw error
        }
      },
      remove: async () => {
        await s3.send(new DeleteObjectCommand(params))
      },
    }
  }

  #supportsConditionalWrites() {
    if (this.#conditionalWrites === undefined) {
      const store = this.#createLockStore(`/.xo-lock-probe-${randomBytes(8).toString('hex')}`)
      this.#conditionalWrites = probeConditionalWrites(store).then(
        reason => {
          if (reason !== undefined) {
            warn('the S3 provider does not honour conditional writes, nothing is locked on this remote', {
              reason,
            })
          }
          return reason === undefined
        },
        error => {
          // a failed request says nothing about the provider: probe again on the next lock
          this.#conditionalWrites = undefined
          throw error
        }
      )
    }
    return this.#conditionalWrites
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
            CopySourceRange: `bytes=${start}-${Math.min(start + this.#maxPartSize, size) - 1}`,
            PartNumber: partNumber,
          })
        )
        parts.push({ ETag: upload.CopyPartResult.ETag, PartNumber: partNumber })
        start += this.#maxPartSize
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

  isImmutable() {
    return super.isImmutable() || this.#immutable
  }
  _conditionRetry(error) {
    return ![401, 403, 404, 405].includes(error?.$metadata?.httpStatusCode) && super._conditionRetry(error)
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

  async _outputStream(path, input, { streamLength, maxStreamLength = streamLength, validator }) {
    // S3 storage is limited to 10K part, each part is limited to 5GB. And the total upload must be smaller than 5TB
    // a bigger partSize increase the memory consumption of aws/lib-storage exponentially
    let partSize
    if (maxStreamLength === undefined) {
      warn(`Writing ${path} to a S3 remote without a max size set will cut it to 50GB`, { path })
      partSize = this.#minPartSize // min size for S3
    } else {
      partSize = Math.min(
        Math.max(Math.ceil(maxStreamLength / this.#maxPartNumber), this.#minPartSize),
        this.#maxPartSize
      )
    }

    // ensure we don't try to upload a stream to big for this partSize
    let readCounter = 0
    const MAX_SIZE = this.#maxPartNumber * partSize
    const streamCutter = new Transform({
      transform(chunk, encoding, callback) {
        readCounter += chunk.length
        if (readCounter > MAX_SIZE) {
          callback(new Error(`read ${readCounter} bytes, maximum size allowed  is ${MAX_SIZE} `))
        } else {
          callback(null, chunk)
        }
      },
    })

    // Workaround for "ReferenceError: ReadableStream is not defined"
    // https://github.com/aws/aws-sdk-js-v3/issues/2522
    const Body = new PassThrough()
    pipeline(input, streamCutter, Body, () => {})

    const upload = new Upload({
      client: this.#s3,
      params: {
        ...this.#createParams(path),
        Body,
      },
      partSize,
      leavePartsOnError: false,
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

  async #legacyBatchDeleteCommand(result) {
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
  }

  // reimplement _rmtree to handle efficiently path with more than 1000 entries in trees
  // @todo : use parallel processing for unlink
  async _rmtree(path) {
    let NextContinuationToken
    let supportsDeleteObjects = true
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
      if (supportsDeleteObjects) {
        try {
          await this.#s3.send(
            new DeleteObjectsCommand({
              Bucket: this.#bucket,
              Delete: {
                // only keep the key: `ETag` and `Size` are also part of `ObjectIdentifier`, where they
                // mean "delete only if it still matches", and passing the whole listed object would
                // serialize them in the request. Beyond making the deletion conditional, some
                // providers reject these elements with a `MalformedXML` error.
                Objects: (result.Contents ?? []).map(({ Key }) => ({ Key })),
              },
            })
          )
          // we catch any error because some providers don't return "NotImplemented" errors when they don't
          // support DeleteObjectsCommand. As we catch any error, we don't store supportsDeleteObjects param
          // because it can be due to network issues
        } catch (error) {
          warn('Unsupported DeleteObjects, fallback to DeleteObject.', { error, $response: error.$response ?? '' })
          supportsDeleteObjects = false
          await this.#legacyBatchDeleteCommand(result)
        }
      } else {
        await this.#legacyBatchDeleteCommand(result)
      }
    } while (NextContinuationToken !== undefined)
  }

  async _openFile(path, flags) {
    return path
  }

  async _closeFile(fd) {}

  async _sync() {
    await super._sync()
    try {
      // if Object Lock is enabled, each upload must come with a contentMD5 header
      // the computation of this md5 is memory-intensive, especially when uploading a stream
      const res = await this.#s3.send(new GetObjectLockConfigurationCommand({ Bucket: this.#bucket }))
      if (res.ObjectLockConfiguration?.ObjectLockEnabled === 'Enabled') {
        // Workaround for https://github.com/aws/aws-sdk-js-v3/issues/2673
        // will automatically add the contentMD5 header to any upload to S3
        debug(`Object Lock is enable, enable content md5 header`)
        this.#s3.middlewareStack.use(getApplyMd5BodyChecksumPlugin(this.#s3.config))
        this.#immutable = true
      }
    } catch (error) {
      // maybe the account doesn't have enough privilege to query the object lock configuration
      // be defensive and apply the md5  just in case
      if (error.$metadata.httpStatusCode === 403) {
        info(`s3 user doesnt have enough privilege to check for Object Lock, enable content MD5 header`)
        this.#s3.middlewareStack.use(getApplyMd5BodyChecksumPlugin(this.#s3.config))
      } else if (error.Code === 'ObjectLockConfigurationNotFoundError' || error.$metadata.httpStatusCode === 501) {
        info(`Object lock is not available or not configured, don't add the content MD5 header`)
      } else {
        throw error
      }
    }
  }

  async _lock(path) {
    // On an Object Lock bucket, every write of the lock object (taking it, then a refresh every 30 s)
    // would leave a version retained for the whole retention period of the bucket. Locking these buckets
    // is left for later: they keep the no-op lock of `RemoteHandlerAbstract`.
    //
    // `isImmutable()` only knows about Object Lock when the S3 user may read the bucket's configuration
    // (see `_sync()`): without that permission, an Object Lock bucket is locked like any other.
    if (this.isImmutable()) {
      return super._lock(path)
    }

    if (!(await this.#supportsConditionalWrites())) {
      return super._lock(path)
    }

    // `<path>.lock`, the name of the local lock directory: the listings skip it already
    return acquireConditionalLock(this.#createLockStore(`${path}.lock`), path)
  }
}
