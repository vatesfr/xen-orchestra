import {
  Unauthorized
} from '../api-errors'

// ===================================================================

export function create ({ name, subjects, objects }) {
  return this.createResourceSet(name, subjects, objects)
}

create.permission = 'admin'

create.params = {
  name: {
    type: 'string'
  },
  subjects: {
    type: 'array',
    items: {
      type: 'string'
    },
    optional: true
  },
  objects: {
    type: 'array',
    items: {
      type: 'string'
    },
    optional: true
  }
}

// -------------------------------------------------------------------

function delete_ ({ id }) {
  return this.deleteResourceSet(id)
}
export { delete_ as delete }

delete_.permission = 'admin'

delete_.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export function set ({ id, name, subjects, objects }) {
  return this.updateResourceSet(id, { name, subjects, objects })
}

set.permission = 'admin'

set.params = {
  id: {
    type: 'string'
  },
  name: {
    type: 'string',
    optional: true
  },
  subjects: {
    type: 'array',
    items: {
      type: 'string'
    },
    optional: true
  },
  objects: {
    type: 'array',
    items: {
      type: 'string'
    },
    optional: true
  }
}

// -------------------------------------------------------------------

export function get ({ id }) {
  return this.getResourceSet(id)
}

get.permission = 'admin'

get.params = {
  id: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export async function getAll () {
  const { user } = this
  if (!user) {
    throw new Unauthorized()
  }

  return this.getAllResourceSets(user.id)
}

// -------------------------------------------------------------------

export function addObject ({ id, object }) {
  return this.addObjectToResourceSet(object, id)
}

addObject.permission = 'admin'

addObject.params = {
  id: {
    type: 'string'
  },
  object: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export function removeObject ({ id, object }) {
  return this.removeObjectFromResourceSet(object, id)
}

removeObject.permission = 'admin'

removeObject.params = {
  id: {
    type: 'string'
  },
  object: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export function addSubject ({ id, subject }) {
  return this.addSubjectToResourceSet(subject)
}

addSubject.permission = 'admin'

addSubject.params = {
  id: {
    type: 'string'
  },
  object: {
    type: 'string'
  }
}

// -------------------------------------------------------------------

export function removeSubject ({ id, subject }) {
  return this.removeSubjectFromResourceSet(subject)
}

removeSubject.permission = 'admin'

removeSubject.params = {
  id: {
    type: 'string'
  },
  object: {
    type: 'string'
  }
}
