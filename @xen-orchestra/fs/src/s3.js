import aws from '@sullux/aws-sdk'
import assert from 'assert'
import http from 'http'
import https from 'https'
import { parse } from 'xo-remote-parser'
import { getChunkIterator } from 'vhd-lib'

import RemoteHandlerAbstract from './abstract'

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
    const { host, path, username, password, protocol, region } = parse(remote.url)
    const params = {
      accessKeyId: username,
      apiVersion: '2006-03-01',
      endpoint: host,
      s3ForcePathStyle: true,
      secretAccessKey: password,
      signatureVersion: 'v4',
      httpOptions: {
        timeout: 600000,
        agent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true,
        }),
      },
    }
    if (protocol === 'http') {
      params.httpOptions.agent = new http.Agent()
      params.sslEnabled = false
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

  async _isAlias(path) {
    const isFile = await this._isFile(path)
    const size = await this._getSize(path)
    return isFile && size > 0 && size < 1024
  }

  async resolveAlias(path) {
    if (!(await this._isAlias(path))) {
      return null
    }
    return this._read(path, Buffer.alloc(1024, 0, 'utf-8'))
  }

  async _outputStreamChunked(path, input) {
    // @TODO: use parallel writing
    const iterator = getChunkIterator(input)
    for await (const chunk of iterator) {
      const { type } = chunk
      switch (type) {
        case 'footer':
          await this._writeFile(path + '/footer', chunk.buffer)
          break
        case 'header':
          await this._writeFile(path + '/header', chunk.buffer)
          break
        case 'bat':
          // raw BAT is not used in this upload type
          break
        case 'bytesBat':
          await this._writeFile(path + '/bat', chunk.buffer)
          break
        case 'block':
          await this._writeFile(path + '/' + chunk.index, chunk.buffer)
          break
        case 'parentLocator':
          await this._writeFile(path + '/parentLocator' + chunk.index, chunk.buffer)
          break
        default:
          throw new Error(`Chunk of type ${type} can't be writtent to ${path}`)
      }
    }
  }

  async _outputStream(path, input, { validator }) {
    if (path.endsWith('.vhd')) {
      await this._outputStreamChunked(path, input)
    } else {
      await this._s3.upload(
        {
          ...this._createParams(path),
          Body: input,
        },
        { partSize: IDEAL_FRAGMENT_SIZE, queueSize: 1 }
      )
    }

    // @TODO: is it possible to validate an exploded file ?
    if (validator !== undefined) {
      try {
        await validator.call(this, path)
      } catch (error) {
        await this.unlink(path)
        throw error
      }
    }
  }

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

  async _unlinkFile(path) {
    await this._s3.deleteObject(this._createParams(path))
  }

  async _unlinkDirContent(path) {
    const params = {
      Bucket: this._bucket,
      Prefix: path,
    }
    do {
      const { NextContinuationToken, Contents } = await this._s3.listObjectsV2(params)
      params.ContinuationToken = NextContinuationToken
      const deleteParams = {
        Bucket: this._bucket,
        Delete: Contents,
      }
      // list object returns at most 1 000 entry and
      // delete can be made by 1 000
      await this.s3.deleteObjects(deleteParams)
    } while (params.ContinuationToken)
  }

  async _unlink(path) {
    if (await this._isFile(path)) {
      const resolved = this._resolveAlias(path)
      if (resolved) {
        return this._unlinkDirContent(resolved)
      }
      return this._unlinkFile(path)
    }

    throw new Error(`Can't delete non empty  directory ${path}`)
  }

  async _list(dir) {
    function splitPath(path) {
      return path.split('/').filter(d => d.length)
    }

    const prefix = [this._dir, dir].join('/')
    const splitPrefix = splitPath(prefix)
    const params = {
      Bucket: this._bucket,
      Prefix: splitPrefix.join('/'),
    }
    const uniq = new Set()
    // handle more than 1000
    const { NextContinuationToken, Contents } = await this._s3.listObjectsV2(params)
    if (NextContinuationToken) {
      throw new Error(`path ${dir} has more than 1000 children`)
    }
    for (const entry of Contents) {
      const line = splitPath(entry.Key)
      if (line.length > splitPrefix.length) {
        uniq.add(line[splitPrefix.length])
      }
    }

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

  async _copyFile(oldPath, newPath) {
    const size = await this._getSize(oldPath)
    const multipartParams = await this._s3.createMultipartUpload({ ...this._createParams(newPath) })
    const param2 = { ...multipartParams, CopySource: `/${this._bucket}/${this._dir}${oldPath}` }
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
    if (!(await this._isFile(oldPath))) {
      throw new Error(`S3 directory copy of ${oldPath} to ${newPath} is not implemented`)
    }
    if (await this._isAlias(oldPath)) {
      throw new Error(`copy of alias ${oldPath} is not implemented`)
    }
    if (await this._isAlias(newPath)) {
      throw new Error(`copy ${oldPath} toward an alias ${newPath} is not implemented`)
    }
    return this._copyFile(oldPath, newPath)
  }

  async _renameFile(oldPath, newPath) {
    await this._copy(oldPath, newPath)
    await this._s3.deleteObject(this._createParams(oldPath))
  }

  async _rename(oldPath, newPath) {
    if (!(await this._isFile(oldPath))) {
      throw new Error('S3 directory renaming is not implemented')
    }
    // if destination is an alias, we need to ensure we don't let
    // the directory data alone
    if (await this._isAlias(newPath)) {
      await this._unlink(newPath)
    }

    // really rename the file ( which can be an alias)
    return this._renameFile(oldPath, newPath)
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
    const result = await this._s3.getObject(params)
    result.Body.copy(buffer)
    return { bytesRead: result.Body.length, buffer }
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
