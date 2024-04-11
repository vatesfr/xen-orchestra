export function sortByNameLabel<TObj extends { name_label: string }>(obj1: TObj, obj2: TObj) {
  const label1 = obj1.name_label.toLocaleLowerCase()
  const label2 = obj2.name_label.toLocaleLowerCase()

  return label1.localeCompare(label2, undefined, { numeric: true })
}
