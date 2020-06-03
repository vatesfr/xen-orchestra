import AWS from 'aws-sdk'
import { parse } from 'xo-remote-parser'

import RemoteHandlerAbstract from './abstract'

export default class S3Handler extends RemoteHandlerAbstract {
  constructor(remote, _opts) {
    super(remote)
    const { host, path, username, password } = parse(remote.url)

    // https://www.zenko.io/blog/first-things-first-getting-started-scality-s3-server/
    AWS.config.update({ accessKeyId: username, secretAccessKey: password })

    this._s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      s3ForcePathStyle: true,
      endpoint: host,
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

  async _writeFile(file, data, options) {
    return this._s3
      .putObject({ ...this._createParams(file), Body: data })
      .promise()
  }

  async _createReadStream(file, options) {
    return this._s3.getObject(this._createParams(file)).createReadStream()
  }

  async _unlink(file) {
    return this._s3.deleteObject(this._createParams(file)).promise()
  }
}
