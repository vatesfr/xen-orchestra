// @flow

import jwt from 'jsonwebtoken'
import { fromCallback } from 'promise-toolbox'

export default class JsonWebToken {
  _encodeOpts: Object
  _secret: string

  constructor (_: any, {
    config: { jwt: { expiresIn, secret } },
  }: {
    config: { jwt: { expiresIn?: string, secret: string } }
  }) {
    this._encodeOpts = { expiresIn }
    this._secret = secret
  }

  decodeJwt (token: string): Promise<any> {
    return fromCallback(cb => jwt.verify(token, this._secret, cb))
  }

  encodeJwt (payload: any): Promise<string> {
    return fromCallback(cb =>
      jwt.sign(payload, this._secret, this._encodeOpts, cb)
    )
  }
}
