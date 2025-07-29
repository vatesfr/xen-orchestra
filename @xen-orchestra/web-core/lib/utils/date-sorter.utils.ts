export function createDateSorter<T>(key: keyof T) {
  return (a: T, b: T) => {
    const dateA = new Date(a[key] as Date | string | number)
    const dateB = new Date(b[key] as Date | string | number)
    return dateB.getTime() - dateA.getTime()
  }
}
