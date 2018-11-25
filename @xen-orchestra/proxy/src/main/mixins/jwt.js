import * as Base64 from 'base64url'
import * as MessagePack from 'messagepack'
import jwt from 'jsonwebtoken'
import { fromCallback } from 'promise-toolbox'
import { randomBytes } from 'crypto'

// the payload in the '' property of an object because:
// - it allows the payload to be anything, not just an object
// - it prevents the payload from interfering with registered entries
//   (https://www.iana.org/assignments/jwt/jwt.xhtml)
// - '' is the smallest key possible: small overhead
const extract = payload => payload['']

// our token are using MessagePack for both the header and the payload to be
// smaller
const mpwtToJwt = token =>
  token
    .split('.')
    .map((_, i) =>
      i < 2
        ? Base64.encode(
            JSON.stringify(
              MessagePack.decode(new Uint8Array(Base64.toBuffer(_)))
            )
          )
        : _
    )
    .join('.')
const jwtToMpwt = token =>
  token
    .split('.')
    .map((_, i) =>
      i < 2
        ? Base64.encode(MessagePack.encode(JSON.parse(Base64.decode(_))))
        : _
    )
    .join('.')

export default class JsonWebToken {
  constructor(
    app,
    {
      config: {
        jwt: { expiresIn },
      },
    }
  ) {
    this._encodeOpts = { expiresIn }

    app.on('start', async () => {
      let secret = app.settings.get('jwt.secret')
      if (secret === undefined) {
        secret = await fromCallback(cb => randomBytes(255, cb))
        app.settings.set('jwt.secret', secret)
      }
      this._secret = secret
    })
  }

  decode(token: string): Promise<mixed> {
    return fromCallback(cb =>
      jwt.verify(mpwtToJwt(token), this._secret, cb)
    ).then(extract)
  }

  encode(payload: mixed): Promise<string> {
    return fromCallback(cb =>
      jwt.sign({ '': payload }, this._secret, this._encodeOpts, cb)
    ).then(jwtToMpwt)
  }
}
