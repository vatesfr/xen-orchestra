import { XoUser } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

export class UserService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  #sanitizeUser(user: XoUser): XoUser {
    const sanitizedUser = { ...user }

    if (sanitizedUser.pw_hash !== undefined) {
      sanitizedUser.pw_hash = '***obfuscated***'
    }

    return sanitizedUser
  }

  async getUser(id: XoUser['id']): Promise<XoUser> {
    const user = await this.#restApi.xoApp.getUser(id)
    return this.#sanitizeUser(user)
  }

  async getUsers(): Promise<XoUser[]> {
    const users = await this.#restApi.xoApp.getAllUsers()
    return users.map(user => this.#sanitizeUser(user))
  }
}
