import { toClassName } from './to-class-name'

export function propertyLink(itemName: string, property: string) {
  return `${toClassName(itemName)}["${property}"]`
}
