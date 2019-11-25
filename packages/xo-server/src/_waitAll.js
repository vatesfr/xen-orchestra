// wait for all promises to be resolved/rejected
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
