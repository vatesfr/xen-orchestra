import Collection from '../collection/redis.mjs'

// ===================================================================

export class Tokens extends Collection {
  _unserialize(token) {
    if (token.created_at !== undefined) {
      token.created_at = +token.created_at
    }
    token.expiration = +token.expiration
  }
}
