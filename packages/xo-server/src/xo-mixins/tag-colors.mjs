import { TagColors } from '../models/tag-colors.mjs'

export default class {
  constructor(app) {
    app.hooks.on('clean', () => this._tagColors.rebuildIndexes())
    app.hooks.on('core started', () => {
      this._tagColors = new TagColors({
        connection: app._redis,
        namespace: 'tagColors',
        indexes: ['id', 'tag'],
      })
      app.addConfigManager(
        'tagColors',
        () => this._tagColors.get(),
        tagColors => tagColors.update(tagColors)
      )
    })
  }

  async addTagColor(tag, color) {
    const tagColor = (await this._tagColors.get({ tag }))[0]
    if (tagColor !== undefined) {
      await this._tagColors.update({ ...tagColor, color })
    } else {
      await this._tagColors.add({
        tag,
        color,
      })
    }
  }

  async deleteTagColor(id) {
    await this._tagColors.remove({ id })
  }

  getTagColors() {
    return this._tagColors.get()
  }
}
