import assert from 'assert'

import { Profile } from '../Profile'

export default class Authentication {
  constructor(
    _,
    {
      config: { authenticationToken },
    }
  ) {
    assert(authenticationToken !== undefined)

    this._authenticationToken = authenticationToken
  }

  async findProfile(credentials) {
    if (credentials?.authenticationToken === this._authenticationToken) {
      return new Profile()
    }
  }
}
