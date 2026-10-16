import { isSelectablePrivilegeResource, type PrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { NumberOrStringNode, Or, parse, Property, StringNode, type Node } from 'complex-matcher'

// A manual selection has no field of its own on a privilege: it is stored as a selector matching the
// selected objects by id, `id:|(id1 id2)`. Building it from nodes lets complex-matcher quote the ids.
export function buildManualSelectionSelector(ids: string[]): string {
  return new Property('id', new Or(ids.map(id => new StringNode(id)))).toString()
}

function parseSelector(selector: string): Node | undefined {
  try {
    return parse(selector)
  } catch {
    return undefined
  }
}

function getNodeValue(node: Node): string | undefined {
  return node instanceof StringNode || node instanceof NumberOrStringNode ? node.value : undefined
}

// Returns the selected ids when the selector is a manual selection, `undefined` otherwise.
// complex-matcher prints a single-id selection as `id:id1`, so it is read as a manual selection too.
export function parseManualSelectionSelector(selector: string): string[] | undefined {
  const node = parseSelector(selector)

  if (!(node instanceof Property) || node.name !== 'id') {
    return undefined
  }

  const valueNodes = node.child instanceof Or ? node.child.children : [node.child]

  const ids = valueNodes.map(getNodeValue).filter(id => id !== undefined)

  return ids.length === valueNodes.length ? ids : undefined
}

// A privilege without a selector applies to every object of its resource, which is the "all objects"
// scope. A manual selection is stored as a selector matching the selected ids, and a dynamic selection
// as the query built by the user.
export const PRIVILEGE_SCOPE_TYPES = ['all-objects', 'manual-selection', 'dynamic-selection'] as const

export type PrivilegeScopeType = (typeof PRIVILEGE_SCOPE_TYPES)[number]

const RESOURCES_WITHOUT_MANUAL_SELECTION: PrivilegeResource[] = [
  'acl-privilege',
  'alarm',
  'backup-archive',
  'backup-log',
  'message',
  'pbd',
  'pgpu',
  'pif',
  'restore-log',
  'task',
  'vbd',
  'vif',
]

export function getAvailablePrivilegeScopeTypes(resource: PrivilegeResource | undefined): PrivilegeScopeType[] {
  if (resource === undefined || !isSelectablePrivilegeResource(resource)) {
    return ['all-objects']
  }

  if (RESOURCES_WITHOUT_MANUAL_SELECTION.includes(resource)) {
    return ['all-objects', 'dynamic-selection']
  }

  return [...PRIVILEGE_SCOPE_TYPES]
}

export function getPrivilegeScopeType(selector: string | undefined): PrivilegeScopeType {
  if (selector === undefined) {
    return 'all-objects'
  }

  return parseManualSelectionSelector(selector) === undefined ? 'dynamic-selection' : 'manual-selection'
}
