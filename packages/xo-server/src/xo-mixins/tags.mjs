import { invalidParameters } from 'xo-common/api-errors.js'

import { Tags as TagsCollection } from '../models/tag.mjs'

export default class Tags {
  constructor(app) {
    app.hooks.on('clean', () => this._tags.rebuildIndexes())
    app.hooks.on('core started', () => {
      this._tags = new TagsCollection({
        connection: app._redis,
        namespace: 'tag',
        indexes: ['id'],
      })
      app.addConfigManager(
        'tags',
        () => this._tags.get(),
        tags => this._tags.update(tags)
      )
    })
  }

  #isColorInHex(color) {
    return /^#?([0-9A-F]{3}){1,2}$/i.test(color)
  }

  async setTag(id, { color }) {
    const tags = this._tags

    console.log('this tag already exist: ', await tags.exists(id))

    const tag = (await tags.first(id)) ?? { id }

    if (color !== undefined) {
      if (color === null) {
        delete tag.color
      } else {
        if (!this.#isColorInHex(color)) {
          throw invalidParameters('the color must be in hexadecimal format')
        }

        tag.color = color
      }
    }

    const hasProps = Object.keys(tag).some(k => k !== 'id')
    await (hasProps ? tags.update(tag) : tags.remove(id))
  }

  getConfiguredTags() {
    return this._tags.get()
  }
}
