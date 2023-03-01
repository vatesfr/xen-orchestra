export function create({ name, subjects, objects, limits }) {
  return this.createResourceSet(name, subjects, objects, limits)
}

create.permission = 'admin'

create.params = {
  name: {
    type: 'string',
  },
  subjects: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  objects: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  limits: {
    type: 'object',
    optional: true,
  },
}

// -------------------------------------------------------------------

function delete_({ id }) {
  return this.deleteResourceSet(id)
}
export { delete_ as delete }

delete_.permission = 'admin'

delete_.params = {
  id: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function set({ id, name, subjects, objects, ipPools, limits }) {
  return this.updateResourceSet(id, {
    limits,
    name,
    objects,
    ipPools,
    subjects,
  })
}

set.permission = 'admin'

set.params = {
  id: {
    type: 'string',
  },
  name: {
    type: 'string',
    optional: true,
  },
  subjects: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  objects: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  ipPools: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  limits: {
    type: 'object',
    optional: true,
  },
}

// -------------------------------------------------------------------

export function get({ id }) {
  return this.getResourceSet(id)
}

get.params = {
  id: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export async function getAll() {
  return this.getAllResourceSets(this.apiContext.user.id)
}

getAll.description = 'Get the list of all existing resource set'

// -------------------------------------------------------------------

export function addObject({ id, object }) {
  return this.addObjectToResourceSet(object, id)
}

addObject.permission = 'admin'

addObject.params = {
  id: {
    type: 'string',
  },
  object: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function removeObject({ id, object }) {
  return this.removeObjectFromResourceSet(object, id)
}

removeObject.permission = 'admin'

removeObject.params = {
  id: {
    type: 'string',
  },
  object: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function addSubject({ id, subject }) {
  return this.addSubjectToResourceSet(subject, id)
}

addSubject.permission = 'admin'

addSubject.params = {
  id: {
    type: 'string',
  },
  subject: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function removeSubject({ id, subject }) {
  return this.removeSubjectFromResourceSet(subject, id)
}

removeSubject.permission = 'admin'

removeSubject.params = {
  id: {
    type: 'string',
  },
  subject: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function addLimit({ id, limitId, quantity }) {
  return this.addLimitToResourceSet(limitId, quantity, id)
}

addLimit.permission = 'admin'

addLimit.params = {
  id: {
    type: 'string',
  },
  limitId: {
    type: 'string',
  },
  quantity: {
    type: 'integer',
  },
}

// -------------------------------------------------------------------

export function removeLimit({ id, limitId }) {
  return this.removeLimitFromResourceSet(limitId, id)
}

removeLimit.permission = 'admin'

removeLimit.params = {
  id: {
    type: 'string',
  },
  limitId: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function recomputeAllLimits() {
  return this.recomputeResourceSetsLimits()
}

recomputeAllLimits.permission = 'admin'
recomputeAllLimits.description = 'Recompute manually the current resource set usage'
