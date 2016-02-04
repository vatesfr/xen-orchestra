export function create ({ name }) {
  return this.createResourceSet(name)
}

create.permission = 'admin'

// -------------------------------------------------------------------

function delete_ ({ id }) {
  return this.deleteResourceSet(id)
}
export { delete_ as delete }

delete_.permission = 'admin'

// -------------------------------------------------------------------

export function get ({ id }) {
  return id == null
    ? this.getAllResourceSets()
    : this.getResourceSet(id)
}

get.permission = 'admin'

// -------------------------------------------------------------------

export function addObject ({ object }) {
  return this.addObjectToResourceSet(object)
}

addObject.permission = 'admin'

// -------------------------------------------------------------------

export function removeObject ({ object }) {
  return this.removeObjectFromResourceSet(object)
}

removeObject.permission = 'admin'

// -------------------------------------------------------------------

export function addSubject ({ subject }) {
  return this.addSubjectToResourceSet(subject)
}

addSubject.permission = 'admin'

// -------------------------------------------------------------------

export function removeSubject ({ subject }) {
  return this.removeSubjectFromResourceSet(subject)
}

removeSubject.permission = 'admin'
