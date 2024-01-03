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

  #convertToLongHex(shortHex) {
    if (shortHex.length !== 4) {
      throw invalidParameters('to convert color to full hex format, color must have 4 characters')
    }

    const [, r, g, b] = shortHex
    return `#${r}${r}${g}${g}${b}${b}`
  }

  async setTag(id, { color }) {
    const tags = this._tags

    const tag = (await tags.first(id)) ?? { id }

    if (color !== undefined) {
      if (color === null) {
        delete tag.color
      } else {
        if (!this.#isColorInHex(color)) {
          throw invalidParameters('the color must be in hexadecimal format')
        }

        color = color.length === 4 ? this.#convertToLongHex(color) : color
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
