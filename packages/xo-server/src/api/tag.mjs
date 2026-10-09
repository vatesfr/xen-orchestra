export async function add({ tag, object }) {
  await this.getXapiObject(object).add_tags(tag)
}

add.description = 'add a new tag to an object'

add.resolve = {
  object: ['id', null, 'administrate'],
}

add.params = {
  tag: { type: 'string' },
  id: { type: 'string' },
}

// -------------------------------------------------------------------

export async function remove({ tag, object }) {
  await this.getXapiObject(object).remove_tags(tag)
}

remove.description = 'remove an existing tag from an object'

remove.resolve = {
  object: ['id', null, 'administrate'],
}

remove.params = {
  tag: { type: 'string', minLength: 0 },
  id: { type: 'string' },
}

// -------------------------------------------------------------------

export async function set({ id, ...params }) {
  await this.setTag(id, params)
}

set.description = 'Set a tag configuration'

set.params = {
  id: { type: 'string' },
  color: { nullable: true, optional: true, pattern: '^#?([0-9A-Fa-f]{6})$', type: 'string' },
}

set.permission = 'admin'

export async function getAllConfigured() {
  const configuredTags = await this.getConfiguredTags()

  const isObjectVisible = await this.getObjectFilterForUser(this.apiContext.user.id)
  if (isObjectVisible === undefined) {
    return configuredTags
  }

  const visibleTags = new Set()
  const objects = this.getObjects()
  for (const id in objects) {
    const { tags } = objects[id]
    if (tags !== undefined && tags.length !== 0 && isObjectVisible(id)) {
      for (const tag of tags) {
        visibleTags.add(tag)
      }
    }
  }

  return configuredTags.filter(({ id }) => visibleTags.has(id))
}

getAllConfigured.description = 'Get all configured tags'
