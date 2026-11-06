import { isSelectablePrivilegeResource, type PrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { NumberOrStringNode, Or, parse, Property, StringNode, type Node } from 'complex-matcher'

// A manual selection is stored as a selector matching the selected ids, `id:|(id1 id2)`, which
// complex-matcher prints as `id:id1` for a single id.
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

export function parseManualSelectionSelector(selector: string): string[] | undefined {
  const node = parseSelector(selector)

  if (!(node instanceof Property) || node.name !== 'id') {
    return undefined
  }

  const valueNodes = node.child instanceof Or ? node.child.children : [node.child]

  const ids = valueNodes.map(getNodeValue).filter(id => id !== undefined)

  return ids.length === valueNodes.length ? ids : undefined
}

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

export function getAvailablePrivilegeScopeTypes(resource: string | undefined): PrivilegeScopeType[] {
  if (resource === undefined || !isSelectablePrivilegeResource(resource)) {
    return ['all-objects']
  }

  if (RESOURCES_WITHOUT_MANUAL_SELECTION.includes(resource)) {
    return ['all-objects', 'dynamic-selection']
  }

  return [...PRIVILEGE_SCOPE_TYPES]
}

export function getPrivilegeScopeType(resource: string | undefined, selector: string | undefined): PrivilegeScopeType {
  if (selector === undefined) {
    return 'all-objects'
  }

  const isManualSelection =
    getAvailablePrivilegeScopeTypes(resource).includes('manual-selection') &&
    parseManualSelectionSelector(selector) !== undefined

  return isManualSelection ? 'manual-selection' : 'dynamic-selection'
}
