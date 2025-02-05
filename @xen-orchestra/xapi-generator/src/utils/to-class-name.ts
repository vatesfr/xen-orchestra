import { toPascalCase } from './to-pascal-case'

export function toClassName(name: string) {
  return 'XenApi' + toPascalCase(name)
}
