export function sortRecordsByNameLabel(
  record1: { name_label: string },
  record2: { name_label: string }
) {
  const label1 = record1.name_label.toLocaleLowerCase();
  const label2 = record2.name_label.toLocaleLowerCase();

  switch (true) {
    case label1 < label2:
      return -1;
    case label1 > label2:
      return 1;
    default:
      return 0;
  }
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
