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
  UploadPartCommand,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { getApplyMd5BodyChecksumPlugin } from '@aws-sdk/middleware-apply-body-checksum'
import assert from 'assert'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { PassThrough, pipeline } from 'stream'
import { parse } from 'xo-remote-parser'
import copyStreamToBuffer from './_copyStreamToBuffer.js'
import createBufferFromStream from './_createBufferFromStream.js'
import guessAwsRegion from './_guessAwsRegion.js'
import RemoteHandlerAbstract from './abstract'
import { basename, join, split } from './_path'
import { asyncEach } from '@vates/async-each'

// endpoints https://docs.aws.amazon.com/general/latest/gr/s3.html

// limits: https://docs.aws.amazon.com/AmazonS3/latest/dev/qfacts.html
const MIN_PART_SIZE = 1024 * 1024 * 5 // 5MB
const MAX_PART_SIZE = 1024 * 1024 * 1024 * 5 // 5GB
const MAX_PARTS_COUNT = 10000
const MAX_OBJECT_SIZE = 1024 * 1024 * 1024 * 1024 * 5 // 5TB
const IDEAL_FRAGMENT_SIZE = Math.ceil(MAX_OBJECT_SIZE / MAX_PARTS_COUNT) // the smallest fragment size that still allows a 5TB upload in 10000 fragments, about 524MB

const { warn } = createLogger('xo:fs:s3')

export default class S3Handler extends RemoteHandlerAbstract {
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

    this._s3 = new S3Client({
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
    this._s3.middlewareStack.use(
      getApplyMd5BodyChecksumPlugin(this._s3.config)
    )

    const parts = split(path)
    this._bucket = parts.shift()
    this._dir = join(...parts)
  }

  get type() {
    return 's3'
  }

  _makeCopySource(path) {
    return join(this._bucket, this._dir, path)
  }

  _makeKey(file) {
    return join(this._dir, file)
  }

  _makePrefix(dir) {
    return join(this._dir, dir, '/')
  }

  _createParams(file) {
    return { Bucket: this._bucket, Key: this._makeKey(file) }
  }

  async _multipartCopy(oldPath, newPath) {
    const size = await this._getSize(oldPath)
    const CopySource = this._makeCopySource(oldPath)
    const multipartParams = await this._s3.send(new CreateMultipartUploadCommand({ ...this._createParams(newPath) }))
    try {
      const parts = []
      let start = 0
      while (start < size) {
        const partNumber = parts.length + 1
        const upload = await this._s3.send(
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
      await this._s3.send(
        new CompleteMultipartUploadCommand({
          ...multipartParams,
          MultipartUpload: { Parts: parts },
        })
      )
    } catch (e) {
      await this._s3.send(new AbortMultipartUploadCommand(multipartParams))
      throw e
    }
  }

  async _copy(oldPath, newPath) {
    const CopySource = this._makeCopySource(oldPath)
    try {
      await this._s3.send(
        new CopyObjectCommand({
          ...this._createParams(newPath),
          CopySource,
        })
      )
    } catch (e) {
      // object > 5GB must be copied part by part
      if (e.name === 'EntityTooLarge') {
        return this._multipartCopy(oldPath, newPath)
      }
      throw e
    }
  }

  async _isNotEmptyDir(path) {
    const result = await this._s3.send(
      new ListObjectsV2Command({
        Bucket: this._bucket,
        MaxKeys: 1,
        Prefix: this._makePrefix(path),
      })
    )
    return result.Contents?.length > 0
  }

  async _isFile(path) {
    try {
      await this._s3.send(new HeadObjectCommand(this._createParams(path)))
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
      client: this._s3,
      queueSize: 1,
      partSize: IDEAL_FRAGMENT_SIZE,
      params: {
        ...this._createParams(path),
        Body,
      },
    })

    await upload.done()

    if (validator !== undefined) {
      try {
        await validator.call(this, path)
      } catch (error) {
        await this.unlink(path)
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
    return this._s3.send(
      new PutObjectCommand({
        ...this._createParams(file),
        Body: data,
      })
    )
  }

  async _createReadStream(path, options) {
    if (!(await this._isFile(path))) {
      const error = new Error(`ENOENT: no such file '${path}'`)
      error.code = 'ENOENT'
      error.path = path
      throw error
    }

    return (await this._s3.send(new GetObjectCommand(this._createParams(path)))).Body
  }

  async _unlink(path) {
    await this._s3.send(new DeleteObjectCommand(this._createParams(path)))

    if (await this._isNotEmptyDir(path)) {
      const error = new Error(`EISDIR: illegal operation on a directory, unlink '${path}'`)
      error.code = 'EISDIR'
      error.path = path
      throw error
    }
  }

  async _list(dir) {
    let NextContinuationToken
    const uniq = new Set()
    const Prefix = this._makePrefix(dir)

    do {
      const result = await this._s3.send(
        new ListObjectsV2Command({
          Bucket: this._bucket,
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
    if (await this._isFile(path)) {
      const error = new Error(`ENOTDIR: file already exists, mkdir '${path}'`)
      error.code = 'ENOTDIR'
      error.path = path
      throw error
    }
    // nothing to do, directories do not exist, they are part of the files' path
  }

  // s3 doesn't have a rename operation, so copy + delete source
  async _rename(oldPath, newPath) {
    await this.copy(oldPath, newPath)
    await this._s3.send(new DeleteObjectCommand(this._createParams(oldPath)))
  }

  async _getSize(file) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const result = await this._s3.send(new HeadObjectCommand(this._createParams(file)))
    return +result.ContentLength
  }

  async _read(file, buffer, position = 0) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const params = this._createParams(file)
    params.Range = `bytes=${position}-${position + buffer.length - 1}`
    try {
      const result = await this._s3.send(new GetObjectCommand(params))
      const bytesRead = await copyStreamToBuffer(result.Body, buffer)
      return { bytesRead, buffer }
    } catch (e) {
      if (e.name === 'NoSuchKey') {
        if (await this._isNotEmptyDir(file)) {
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
    if (await this._isNotEmptyDir(path)) {
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
    const Prefix = this._makePrefix(path)
    do {
      const result = await this._s3.send(
        new ListObjectsV2Command({
          Bucket: this._bucket,
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
          await this._s3.send(
            new DeleteObjectCommand({
              Bucket: this._bucket,
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

  async _write(file, buffer, position) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const uploadParams = this._createParams(file)
    let fileSize
    try {
      fileSize = +(await this._s3.send(new HeadObjectCommand(uploadParams))).ContentLength
    } catch (e) {
      if (e.name === 'NotFound') {
        fileSize = 0
      } else {
        throw e
      }
    }
    if (fileSize < MIN_PART_SIZE) {
      const resultBuffer = Buffer.alloc(Math.max(fileSize, position + buffer.length))
      if (fileSize !== 0) {
        const result = await this._s3.send(new GetObjectCommand(uploadParams))
        await copyStreamToBuffer(result.Body, resultBuffer)
      } else {
        Buffer.alloc(0).copy(resultBuffer)
      }
      buffer.copy(resultBuffer, position)
      await this._s3.send(
        new PutObjectCommand({
          ...uploadParams,
          Body: resultBuffer,
        })
      )
      return { buffer, bytesWritten: buffer.length }
    } else {
      // using this trick: https://stackoverflow.com/a/38089437/72637
      // multipart fragments have a minimum size of 5Mo and a max of 5Go unless they are last
      // splitting the file in 3 parts: [prefix, edit, suffix]
      // if `prefix` is bigger than 5Mo, it will be sourced from uploadPartCopy()
      // otherwise otherwise it will be downloaded, concatenated to `edit`
      // `edit` will always be an upload part
      // `suffix` will always be sourced from uploadPartCopy()
      // Then everything will be sliced in 5Gb parts before getting uploaded
      const multipartParams = await this._s3.send(new CreateMultipartUploadCommand(uploadParams))
      const copyMultipartParams = {
        ...multipartParams,
        CopySource: this._makeCopySource(file),
      }
      try {
        const parts = []
        const prefixSize = position
        let suffixOffset = prefixSize + buffer.length
        let suffixSize = Math.max(0, fileSize - suffixOffset)
        let hasSuffix = suffixSize > 0
        let editBuffer = buffer
        let editBufferOffset = position
        let partNumber = 1
        let prefixPosition = 0
        // use floor() so that last fragment is handled in the if bellow
        let fragmentsCount = Math.floor(prefixSize / MAX_PART_SIZE)
        const prefixFragmentSize = MAX_PART_SIZE
        let prefixLastFragmentSize = prefixSize - prefixFragmentSize * fragmentsCount
        if (prefixLastFragmentSize >= MIN_PART_SIZE) {
          // the last fragment of the prefix is smaller than MAX_PART_SIZE, but bigger than the minimum
          // so we can copy it too
          fragmentsCount++
          prefixLastFragmentSize = 0
        }
        for (let i = 0; i < fragmentsCount; i++) {
          const fragmentEnd = Math.min(prefixPosition + prefixFragmentSize, prefixSize)
          assert.strictEqual(fragmentEnd - prefixPosition <= MAX_PART_SIZE, true)
          const range = `bytes=${prefixPosition}-${fragmentEnd - 1}`
          const copyPrefixParams = { ...copyMultipartParams, PartNumber: partNumber++, CopySourceRange: range }
          const part = await this._s3.send(new UploadPartCopyCommand(copyPrefixParams))
          parts.push({ ETag: part.CopyPartResult.ETag, PartNumber: copyPrefixParams.PartNumber })
          prefixPosition += prefixFragmentSize
        }
        if (prefixLastFragmentSize) {
          // grab everything from the prefix that was too small to be copied, download and merge to the edit buffer.
          const downloadParams = { ...uploadParams, Range: `bytes=${prefixPosition}-${prefixSize - 1}` }
          let prefixBuffer
          if (prefixSize > 0) {
            const result = await this._s3.send(new GetObjectCommand(downloadParams))
            prefixBuffer = await createBufferFromStream(result.Body)
          } else {
            prefixBuffer = Buffer.alloc(0)
          }
          editBuffer = Buffer.concat([prefixBuffer, buffer])
          editBufferOffset -= prefixLastFragmentSize
        }
        if (hasSuffix && editBuffer.length < MIN_PART_SIZE) {
          // the edit fragment is too short and is not the last fragment
          // let's steal from the suffix fragment to reach the minimum size
          // the suffix might be too short and itself entirely absorbed in the edit fragment, making it the last one.
          const complementSize = Math.min(MIN_PART_SIZE - editBuffer.length, suffixSize)
          const complementOffset = editBufferOffset + editBuffer.length
          suffixOffset += complementSize
          suffixSize -= complementSize
          hasSuffix = suffixSize > 0
          const prefixRange = `bytes=${complementOffset}-${complementOffset + complementSize - 1}`
          const downloadParams = { ...uploadParams, Range: prefixRange }
          const result = await this._s3.send(new GetObjectCommand(downloadParams))
          const complementBuffer = await createBufferFromStream(result.Body)
          editBuffer = Buffer.concat([editBuffer, complementBuffer])
        }
        const editParams = { ...multipartParams, Body: editBuffer, PartNumber: partNumber++ }
        const editPart = await this._s3.send(new UploadPartCommand(editParams))
        parts.push({ ETag: editPart.ETag, PartNumber: editParams.PartNumber })
        if (hasSuffix) {
          // use ceil because the last fragment can be arbitrarily small.
          const suffixFragments = Math.ceil(suffixSize / MAX_PART_SIZE)
          let suffixFragmentOffset = suffixOffset
          for (let i = 0; i < suffixFragments; i++) {
            const fragmentEnd = suffixFragmentOffset + MAX_PART_SIZE
            assert.strictEqual(Math.min(fileSize, fragmentEnd) - suffixFragmentOffset <= MAX_PART_SIZE, true)
            const suffixRange = `bytes=${suffixFragmentOffset}-${Math.min(fileSize, fragmentEnd) - 1}`
            const copySuffixParams = { ...copyMultipartParams, PartNumber: partNumber++, CopySourceRange: suffixRange }
            const suffixPart = (await this._s3.send(new UploadPartCopyCommand(copySuffixParams))).CopyPartResult
            parts.push({ ETag: suffixPart.ETag, PartNumber: copySuffixParams.PartNumber })
            suffixFragmentOffset = fragmentEnd
          }
        }
        await this._s3.send(
          new CompleteMultipartUploadCommand({
            ...multipartParams,
            MultipartUpload: { Parts: parts },
          })
        )
      } catch (e) {
        await this._s3.send(new AbortMultipartUploadCommand(multipartParams))
        throw e
      }
    }
  }

  async _openFile(path, flags) {
    return path
  }

  async _closeFile(fd) {}
}
