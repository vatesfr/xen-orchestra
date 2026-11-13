import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function sortByNameDescription<TObject extends { name_description: string }>(
  { name_description: description1 }: TObject,
  { name_description: description2 }: TObject
) {
  return compareStrings(description1, description2)
}
