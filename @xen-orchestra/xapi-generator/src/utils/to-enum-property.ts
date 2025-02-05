export function toEnumProperty(name: string) {
  return name
    .replace('-', '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase()
}
