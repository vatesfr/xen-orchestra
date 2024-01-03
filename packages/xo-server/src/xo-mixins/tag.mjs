import { invalidParameters } from 'xo-common/api-errors.js'

import { Tags } from '../models/tag.mjs'

export default class {
  constructor(app) {
    app.hooks.on('clean', () => this._tags.rebuildIndexes())
    app.hooks.on('core started', () => {
      this._tags = new Tags({
        connection: app._redis,
        namespace: 'tag',
        indexes: ['id'],
      })
      app.addConfigManager(
        'tags',
        () => this._tags.get(),
        tags => tags.update(tags)
      )
    })
  }

  #removeNullValues(obj) {
    for (const key in obj) {
      if (obj[key] === null) {
        delete obj[key]
      }
    }
  }

  #isColorInHex(color) {
    return /^#?([0-9A-F]{3}){1,2}$/i.test(color)
  }

  async setTag(id, params) {
    console.log('this tag already exist: ', await this._tags.exists(id))

    if (params.color != null && !this.#isColorInHex(params.color)) {
      throw invalidParameters('the color must be in hexadecimal format')
    }

    const tag = (await this._tags.get({ id }))[0]
    if (tag === undefined) {
      this.#removeNullValues(params)
      await this._tags.add({ id, ...params })
    } else {
      const updatedTag = { ...tag, ...params }
      this.#removeNullValues(updatedTag)
      // Workaround
      // if (Object.keys(updatedTag).length === 1) {
      //   await this.deleteTag(id)
      //   return
      // }
      await this._tags.update(updatedTag)
    }
  }

  async deleteTag(id) {
    await this._tags.remove({ id })
  }

  getConfiguredTag() {
    return this._tags.get()
  }
}
