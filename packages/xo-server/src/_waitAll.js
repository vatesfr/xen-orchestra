// waits for all promises to be settled
//
// rejects with the first rejection if any
export const waitAll = async iterable => {
  let reason
  const onReject = r => {
    if (reason === undefined) {
      reason = r
    }
  }

  await Promise.all(Array.from(iterable, promise => promise.catch(onReject)))
  if (reason !== undefined) {
    throw reason
  }
}
