// @ts-check

import Collection from '../../collection/redis.mjs'

export class Privileges extends Collection {
  /**
   * @param {object} params
   * @param {string} params.connection
   * @param {string[]} params.indexes
   * @param {string} params.namespace
   */
  // eslint-disable-next-line no-useless-constructor
  constructor(params) {
    // @ts-ignore Collection.indexes is typed with never[] instead of string[]
    super(params)
  }
}
