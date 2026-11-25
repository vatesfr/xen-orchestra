import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function sortTags(tags: string[]) {
  return [...tags].sort(compareStrings)
}
