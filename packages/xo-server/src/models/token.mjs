import Collection from '../collection/redis.mjs'

// ===================================================================

export class Tokens extends Collection {
  _serialize(token) {
    const { client } = token
    if (client !== undefined) {
      const { id, ...rest } = client
      token.client_id = id
      token.client = JSON.stringify(rest)
    }
  }

  _unserialize(token) {
    const { client, client_id } = token
    if (client !== undefined) {
      token.client = {
        ...JSON.parse(client),
        id: client_id,
      }
      delete token.client_id
    }

    if (token.created_at !== undefined) {
      token.created_at = +token.created_at
    }
    token.expiration = +token.expiration
  }
}
