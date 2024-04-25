export function sortByNameLabel<TObject extends { name_label: string }>(
  { name_label: label1 }: TObject,
  { name_label: label2 }: TObject
) {
  return label1.localeCompare(label2, undefined, { numeric: true })
}
