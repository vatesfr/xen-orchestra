import { Profile } from '../_Profile'

export default class Authentication {
  constructor(_, { config: { authenticationToken } }) {
    if (
      typeof authenticationToken !== 'string' ||
      authenticationToken.length === 0
    ) {
      throw new Error('missing authenticationToken in configuration')
    }

    this._authenticationToken = authenticationToken
  }

  async findProfile(credentials) {
    if (credentials?.authenticationToken === this._authenticationToken) {
      return new Profile()
    }
  }
}
