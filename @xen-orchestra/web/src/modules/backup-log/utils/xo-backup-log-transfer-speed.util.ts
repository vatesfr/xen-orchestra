export function computeTransferSpeed(size: number, start: number, end: number | undefined): number | undefined {
  if (end === undefined || end <= start) {
    return undefined
  }

  return (size * 1000) / (end - start)
}
