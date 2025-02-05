import { propertyLink } from './property-link'
import { toClassName } from './to-class-name'
import { toEnumProperty } from './to-enum-property'
import { XapiItem } from '../types'

export function toType(type: string, propertyName?: string, item?: XapiItem): string {
  if (propertyName === 'uuid' && item !== undefined) {
    return propertyLink(item.name, 'uuid')
  }

  switch (type) {
    case 'an event batch':
      return 'XapiEvent[]'
    case 'void':
      return 'void'
    case 'string':
    case 'datetime':
      return 'string'
    case 'bool':
      return 'boolean'
    case 'int':
    case 'float':
      return 'number'
    case '<class> record':
      return 'object'
  }

  if (type.endsWith(' option')) {
    return 'unknown'
  }

  if (type.endsWith(' set')) {
    return `${toType(type.replace(' set', ''), propertyName, item)}[]`
  }

  if (type.endsWith(' ref')) {
    return propertyLink(type.replace(' ref', ''), '$ref')
  }

  if (type.startsWith('enum ')) {
    return toEnumProperty(type.replace('enum ', ''))
  }

  if (type.endsWith(' map')) {
    const [key, ...value] = type.replace(/ map$/, '').slice(1, -1).split(' -> ')
    return `Record<${toType(key, propertyName, item)}, ${toType(value.join(' -> '), propertyName, item)}>`
  }

  if (type.endsWith(' record')) {
    return toClassName(type.replace(' record', ''))
  }

  return toClassName(type)
}
