import AWS from 'aws-sdk'
import { parse } from 'xo-remote-parser'

import RemoteHandlerAbstract from './abstract'
import { createChecksumStream } from './checksum'

// endpoints https://docs.aws.amazon.com/general/latest/gr/s3.html

// limits: https://docs.aws.amazon.com/AmazonS3/latest/dev/qfacts.html
const MIN_PART_SIZE = 1024 * 1024 * 5 // 5MB
const MAX_PART_SIZE = 1024 * 1024 * 1024 * 5 // 5GB
const MAX_PARTS_COUNT = 10000
const MAX_OBJECT_SIZE = 1024 * 1024 * 1024 * 1024 * 5 // 5TB
const IDEAL_FRAGMENT_SIZE = Math.ceil(MAX_OBJECT_SIZE / MAX_PARTS_COUNT) // the smallest fragment size that still allows a 5TB upload in 10000 fragments, about 524MB
export default class S3Handler extends RemoteHandlerAbstract {
  constructor(remote, _opts) {
    super(remote)
    const { host, path, username, password } = parse(remote.url)

    // https://www.zenko.io/blog/first-things-first-getting-started-scality-s3-server/
    this._s3 = new AWS.S3({
      accessKeyId: username,
      apiVersion: '2006-03-01',
      endpoint: host,
      s3ForcePathStyle: true,
      secretAccessKey: password,
      signatureVersion: 'v4',
    })
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

  async _outputStream(input, path, { checksum }) {
    let inputStream = input
    if (checksum) {
      const checksumStream = createChecksumStream()
      const forwardError = error => {
        checksumStream.emit('error', error)
      }
      input.pipe(checksumStream)
      input.on('error', forwardError)
      inputStream = checksumStream
    }
    const upload = this._s3.upload(
      {
        ...this._createParams(path),
        Body: inputStream,
      },
      { partSize: IDEAL_FRAGMENT_SIZE }
    )
    await upload.promise()
    if (checksum) {
      const checksum = await inputStream.checksum
      const params = {
        ...this._createParams(path + '.checksum'),
        Body: checksum,
      }
      await this._s3.upload(params).promise()
    }
    await input.task
  }

  async _writeFile(file, data, options) {
    return this._s3.putObject({ ...this._createParams(file), Body: data }).promise()
  }

  async _createReadStream(file, options) {
    return this._s3.getObject(this._createParams(file)).createReadStream()
  }

  async _unlink(file) {
    return this._s3.deleteObject(this._createParams(file)).promise()
  }

  async _list(dir) {
    function splitPath(path) {
      return path.split('/').filter(d => d.length)
    }

    const prefix = [this._dir, dir].join('/')
    const splitPrefix = splitPath(prefix)
    const request = this._s3.listObjectsV2({
      Bucket: this._bucket,
      Prefix: splitPrefix.join('/'),
    })
    const result = await request.promise()
    const uniq = new Set()
    for (const entry of result.Contents) {
      const line = splitPath(entry.Key)
      if (line.length > splitPrefix.length) {
        uniq.add(line[splitPrefix.length])
      }
    }
    return [...uniq]
  }

  async _rename(oldPath, newPath) {
    const params = {
      ...this._createParams(newPath),
      CopySource: `/${this._bucket}/${this._dir}${oldPath}`,
    }
    await this._s3.copyObject(params).promise()
    await this._s3.deleteObject(this._createParams(oldPath)).promise()
  }

  async _getSize(file) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const result = await this._s3.headObject(this._createParams(file)).promise()
    return +result.ContentLength
  }

  async _read(file, buffer, position = 0) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const params = this._createParams(file)
    params.Range = `bytes=${position}-${position + buffer.length - 1}`
    const result = await this._s3.getObject(params).promise()
    result.Body.copy(buffer)
    return { bytesRead: result.Body.length, buffer }
  }

  async _write(file, buffer, position) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const uploadParams = this._createParams(file)
    const fileSize = +(await this._s3.headObject(uploadParams).promise()).ContentLength
    if (fileSize < MIN_PART_SIZE) {
      const resultBuffer = Buffer.alloc(Math.max(fileSize, position + buffer.length))
      const fileContent = (await this._s3.getObject(uploadParams).promise()).Body
      fileContent.copy(resultBuffer)
      buffer.copy(resultBuffer, position)
      await this._s3.putObject({ ...uploadParams, Body: resultBuffer }).promise()
      return { buffer, bytesWritten: buffer.length }
    } else {
      // using this trick: https://stackoverflow.com/a/38089437/72637
      // multipart fragments have a minimum size of 5Mo and a max of 5Go unless they are last
      // splitting the file in 3 parts: [prefix, edit, suffix]
      // if `prefix` is bigger than 5Mo, it will be sourced from uploadPartCopy()
      // otherwise otherwise it will be downloaded, concatenated to `edit`
      // `edit` will always be an upload part
      // `suffix` will ways be sourced from uploadPartCopy()
      const multipartParams = await this._s3.createMultipartUpload(uploadParams).promise()
      try {
        const parts = []
        const prefixSize = position
        let suffixOffset = prefixSize + buffer.length
        let suffixSize = Math.max(0, fileSize - suffixOffset)
        let hasSuffix = suffixSize > 0
        let editBuffer = buffer
        let editBufferOffset = position
        let partNumber = 1
        if (prefixSize < MIN_PART_SIZE) {
          const downloadParams = {
            ...uploadParams,
            Range: `bytes=0-${prefixSize - 1}`,
          }
          const prefixBuffer =
            prefixSize > 0 ? (await this._s3.getObject(downloadParams).promise()).Body : Buffer.alloc(0)
          editBuffer = Buffer.concat([prefixBuffer, buffer])
          editBufferOffset = 0
        } else {
          const fragmentsCount = Math.ceil(prefixSize / MAX_PART_SIZE)
          const prefixFragmentSize = Math.ceil(prefixSize / fragmentsCount)
          const lastFragmentSize = prefixFragmentSize * fragmentsCount - prefixSize
          let prefixPosition = 0
          for (let i = 0; i < fragmentsCount; i++) {
            const copyPrefixParams = {
              ...multipartParams,
              PartNumber: partNumber++,
              CopySource: `/${this._bucket}/${this._dir + file}`,
              CopySourceRange: `bytes=${prefixPosition}-${prefixPosition + prefixFragmentSize - 1}`,
            }
            const prefixPart = (await this._s3.uploadPartCopy(copyPrefixParams).promise()).CopyPartResult
            parts.push({
              ETag: prefixPart.ETag,
              PartNumber: copyPrefixParams.PartNumber,
            })
            prefixPosition += prefixFragmentSize
          }
          if (lastFragmentSize) {
          }
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
          const complementBuffer = (await this._s3.getObject(downloadParams).promise()).Body
          editBuffer = Buffer.concat([editBuffer, complementBuffer])
        }
        const editParams = {
          ...multipartParams,
          Body: editBuffer,
          PartNumber: partNumber++,
        }
        const editPart = await this._s3.uploadPart(editParams).promise()
        parts.push({ ETag: editPart.ETag, PartNumber: editParams.PartNumber })
        if (hasSuffix) {
          const suffixFragments = Math.ceil(suffixSize / MAX_PART_SIZE)
          const suffixFragmentsSize = Math.ceil(suffixSize / suffixFragments)
          let suffixFragmentOffset = suffixOffset
          for (let i = 0; i < suffixFragments; i++) {
            const fragmentEnd = suffixFragmentOffset + suffixFragmentsSize
            const suffixRange = `bytes=${suffixFragmentOffset}-${Math.min(fileSize, fragmentEnd) - 1}`
            const copySuffixParams = {
              ...multipartParams,
              PartNumber: partNumber++,
              CopySource: `/${this._bucket}/${this._dir + file}`,
              CopySourceRange: suffixRange,
            }
            const suffixPart = (await this._s3.uploadPartCopy(copySuffixParams).promise()).CopyPartResult
            parts.push({
              ETag: suffixPart.ETag,
              PartNumber: copySuffixParams.PartNumber,
            })
            suffixFragmentOffset = fragmentEnd
          }
        }
        await this._s3
          .completeMultipartUpload({
            ...multipartParams,
            MultipartUpload: { Parts: parts },
          })
          .promise()
      } catch (e) {
        await this._s3.abortMultipartUpload(multipartParams).promise()
        throw e
      }
    }
  }

  async _openFile(path, flags) {
    return path
  }

  async _closeFile(fd) {}
}
