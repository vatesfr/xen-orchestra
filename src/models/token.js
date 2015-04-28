import Collection from '../collection/redis'
import Model from '../model'
import {generateToken} from '../utils'

// ===================================================================

export default class Token extends Model {}

Token.generate = (userId) => {
  return generateToken().then(token => new Token({
    id: token,
    user_id: userId
  }))
}

// -------------------------------------------------------------------

export class Tokens extends Collection {
  get Model () {
    return Token
  }

  generate (userId) {
    return Token.generate(userId).then(token => this.add(token))
  }
}
