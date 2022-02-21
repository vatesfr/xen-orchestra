import aws from '@sullux/aws-sdk'
import assert from 'assert'
import http from 'http'
import https from 'https'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { parse } from 'xo-remote-parser'

import RemoteHandlerAbstract from './abstract'
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
    const { allowUnauthorized, host, path, username, password, protocol, region } = parse(remote.url)
    const params = {
      accessKeyId: username,
      apiVersion: '2006-03-01',
      endpoint: host,
      s3ForcePathStyle: true,
      secretAccessKey: password,
      signatureVersion: 'v4',
      httpOptions: {
        timeout: 600000,
      },
    }
    if (protocol === 'http') {
      params.httpOptions.agent = new http.Agent({ keepAlive: true })
      params.sslEnabled = false
    } else if (protocol === 'https') {
      params.httpOptions.agent = new https.Agent({
        rejectUnauthorized: !allowUnauthorized,
        keepAlive: true,
      })
    }
    if (region !== undefined) {
      params.region = region
    }

    this._s3 = aws(params).s3

    const splitPath = path.split('/').filter(s => s.length)
    this._bucket = splitPath.shift()
    this._dir = splitPath.join('/')
  }

  get type() {
    return 's3'
  }

  _createParams(file) {
    return { Bucket: this._bucket, Key: this._dir + file }
  }

  async _multipartCopy(oldPath, newPath) {
    const size = await this._getSize(oldPath)
    const CopySource = `/${this._bucket}/${this._dir}${oldPath}`
    const multipartParams = await this._s3.createMultipartUpload({ ...this._createParams(newPath) })
    const param2 = { ...multipartParams, CopySource }
    try {
      const parts = []
      let start = 0
      while (start < size) {
        const range = `bytes=${start}-${Math.min(start + MAX_PART_SIZE, size) - 1}`
        const partParams = { ...param2, PartNumber: parts.length + 1, CopySourceRange: range }
        const upload = await this._s3.uploadPartCopy(partParams)
        parts.push({ ETag: upload.CopyPartResult.ETag, PartNumber: partParams.PartNumber })
        start += MAX_PART_SIZE
      }
      await this._s3.completeMultipartUpload({ ...multipartParams, MultipartUpload: { Parts: parts } })
    } catch (e) {
      await this._s3.abortMultipartUpload(multipartParams)
      throw e
    }
  }

  async _copy(oldPath, newPath) {
    const CopySource = `/${this._bucket}/${this._dir}${oldPath}`
    try {
      await this._s3.copyObject({
        ...this._createParams(newPath),
        CopySource,
      })
    } catch (e) {
      // object > 5GB must be copied part by part
      if (e.code === 'EntityTooLarge') {
        return this._multipartCopy(oldPath, newPath)
      }
      throw e
    }
  }

  async _isNotEmptyDir(path) {
    const result = await this._s3.listObjectsV2({
      Bucket: this._bucket,
      MaxKeys: 1,
      Prefix: this._dir + path + '/',
    })
    return result.Contents.length !== 0
  }

  async _isFile(path) {
    try {
      await this._s3.headObject(this._createParams(path))
      return true
    } catch (error) {
      if (error.code === 'NotFound') {
        return false
      }
      throw error
    }
  }

  async _outputStream(path, input, { validator }) {
    await this._s3.upload(
      {
        ...this._createParams(path),
        Body: input,
      },
      { partSize: IDEAL_FRAGMENT_SIZE, queueSize: 1 }
    )
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
    when: e => e.code === 'InternalError',
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
    return this._s3.putObject({ ...this._createParams(file), Body: data })
  }

  async _createReadStream(path, options) {
    if (!(await this._isFile(path))) {
      const error = new Error(`ENOENT: no such file '${path}'`)
      error.code = 'ENOENT'
      error.path = path
      throw error
    }

    // https://github.com/Sullux/aws-sdk/issues/11
    return this._s3.getObject.raw(this._createParams(path)).createReadStream()
  }

  async _unlink(path) {
    await this._s3.deleteObject(this._createParams(path))
    if (await this._isNotEmptyDir(path)) {
      const error = new Error(`EISDIR: illegal operation on a directory, unlink '${path}'`)
      error.code = 'EISDIR'
      error.path = path
      throw error
    }
  }

  async _list(dir) {
    function splitPath(path) {
      return path.split('/').filter(d => d.length)
    }

    const prefix = [this._dir, dir].join('/')
    const splitPrefix = splitPath(prefix)
    const result = await this._s3.listObjectsV2({
      Bucket: this._bucket,
      Prefix: splitPrefix.join('/') + '/', // need slash at the end with the use of delimiters
      Delimiter: '/', // will only return path until delimiters
    })

    if (result.IsTruncated) {
      const error = new Error('more than 1000 objects, unsupported in this implementation')
      error.dir = dir
      throw error
    }

    const uniq = []

    // sub directories
    for (const entry of result.CommonPrefixes) {
      const line = splitPath(entry.Prefix)
      uniq.push(line[line.length - 1])
    }
    // files
    for (const entry of result.Contents) {
      const line = splitPath(entry.Key)
      uniq.push(line[line.length - 1])
    }

    return uniq
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
    await this._s3.deleteObject(this._createParams(oldPath))
  }

  async _getSize(file) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const result = await this._s3.headObject(this._createParams(file))
    return +result.ContentLength
  }

  async _read(file, buffer, position = 0) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const params = this._createParams(file)
    params.Range = `bytes=${position}-${position + buffer.length - 1}`
    try {
      const result = await this._s3.getObject(params)
      result.Body.copy(buffer)
      return { bytesRead: result.Body.length, buffer }
    } catch (e) {
      if (e.code === 'NoSuchKey') {
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
    do {
      const result = await this._s3.listObjectsV2({
        Bucket: this._bucket,
        Prefix: this._dir + path + '/',
        ContinuationToken: NextContinuationToken,
      })
      NextContinuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
      await asyncEach(
        result.Contents,
        async ({ Key }) => {
          // _unlink will add the prefix, but Key contains everything
          // also we don't need to check if we delete a directory, since the list only return files
          await this._s3.deleteObject({
            Bucket: this._bucket,
            Key,
          })
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
      fileSize = +(await this._s3.headObject(uploadParams)).ContentLength
    } catch (e) {
      if (e.code === 'NotFound') {
        fileSize = 0
      } else {
        throw e
      }
    }
    if (fileSize < MIN_PART_SIZE) {
      const resultBuffer = Buffer.alloc(Math.max(fileSize, position + buffer.length))
      const fileContent = fileSize !== 0 ? (await this._s3.getObject(uploadParams)).Body : Buffer.alloc(0)
      fileContent.copy(resultBuffer)
      buffer.copy(resultBuffer, position)
      await this._s3.putObject({ ...uploadParams, Body: resultBuffer })
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
      const multipartParams = await this._s3.createMultipartUpload(uploadParams)
      const copyMultipartParams = {
        ...multipartParams,
        CopySource: `/${this._bucket}/${this._dir + file}`,
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
          const part = await this._s3.uploadPartCopy(copyPrefixParams)
          parts.push({ ETag: part.CopyPartResult.ETag, PartNumber: copyPrefixParams.PartNumber })
          prefixPosition += prefixFragmentSize
        }
        if (prefixLastFragmentSize) {
          // grab everything from the prefix that was too small to be copied, download and merge to the edit buffer.
          const downloadParams = { ...uploadParams, Range: `bytes=${prefixPosition}-${prefixSize - 1}` }
          const prefixBuffer = prefixSize > 0 ? (await this._s3.getObject(downloadParams)).Body : Buffer.alloc(0)
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
          const complementBuffer = (await this._s3.getObject(downloadParams)).Body
          editBuffer = Buffer.concat([editBuffer, complementBuffer])
        }
        const editParams = { ...multipartParams, Body: editBuffer, PartNumber: partNumber++ }
        const editPart = await this._s3.uploadPart(editParams)
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
            const suffixPart = (await this._s3.uploadPartCopy(copySuffixParams)).CopyPartResult
            parts.push({ ETag: suffixPart.ETag, PartNumber: copySuffixParams.PartNumber })
            suffixFragmentOffset = fragmentEnd
          }
        }
        await this._s3.completeMultipartUpload({
          ...multipartParams,
          MultipartUpload: { Parts: parts },
        })
      } catch (e) {
        await this._s3.abortMultipartUpload(multipartParams)
        throw e
      }
    }
  }

  async _openFile(path, flags) {
    return path
  }

  async _closeFile(fd) {}
}
