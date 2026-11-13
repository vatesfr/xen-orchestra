export function compareStrings(string1: string, string2: string) {
  return string1.localeCompare(string2, undefined, { numeric: true })
}

export function compareFirstStrings(strings1: string[], strings2: string[]) {
  return compareStrings(strings1[0] ?? '', strings2[0] ?? '')
}
