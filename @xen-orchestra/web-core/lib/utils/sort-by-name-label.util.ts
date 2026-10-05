import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function sortByNameLabel<TObject extends { name_label: string }>(
  { name_label: label1 }: TObject,
  { name_label: label2 }: TObject
) {
  return compareStrings(label1, label2)
}
