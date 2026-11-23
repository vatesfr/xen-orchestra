// An empty total counts as 0% used
export function getUsageRatio(used: number, total: number) {
  return total === 0 ? 0 : used / total
}
