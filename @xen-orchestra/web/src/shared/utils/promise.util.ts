export async function settleSequentially<TValue>(
  tasks: (() => Promise<TValue>)[]
): Promise<PromiseSettledResult<TValue>[]> {
  const results: PromiseSettledResult<TValue>[] = []

  for (const task of tasks) {
    try {
      results.push({ status: 'fulfilled', value: await task() })
    } catch (reason) {
      results.push({ status: 'rejected', reason })
    }
  }

  return results
}
