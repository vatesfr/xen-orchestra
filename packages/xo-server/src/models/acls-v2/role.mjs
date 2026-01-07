// @ts-check

import Collection from '../../collection/redis.mjs'

export class Roles extends Collection {
  /**
   * @param {object} params
   * @param {string} params.connection
   * @param {string} params.namespace
   */
  // eslint-disable-next-line no-useless-constructor
  constructor(params) {
    super(params)
  }
}
